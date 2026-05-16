import * as fs from 'fs/promises';
import * as path from 'path';
import * as core from '@actions/core';
import { DefaultArtifactClient, Artifact } from '@actions/artifact';
import * as yaml from 'js-yaml';
import { minimatch } from 'minimatch';
import { Config } from '../config/config';

const DOWNLOAD_PATH = '/tmp/lepusinc/gha-report-code-coverage';

interface ArtifactConfig {
  name?: string;
  pattern?: string;
  id?: number;
  'artifact-id'?: number;
  path?: string;
  'merge-multiple'?: boolean;
}

export class SourceResolveProcess {
  async run(config: Config): Promise<string> {
    if (config.artifact.trim() === '') {
      const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
      return path.join(workspace, config.file);
    }

    const parsed = this.parseArtifactConfig(config.artifact);

    if (parsed.path !== undefined) {
      core.warning(
        `'path' in artifact config is ignored; using '${DOWNLOAD_PATH}' instead.`,
      );
    }

    await fs.rm(DOWNLOAD_PATH, { recursive: true, force: true });
    await fs.mkdir(DOWNLOAD_PATH, { recursive: true });

    const client = new DefaultArtifactClient();
    const mergeMultiple = parsed['merge-multiple'] === true;
    const artifactId = parsed.id ?? parsed['artifact-id'];

    if (artifactId !== undefined) {
      await client.downloadArtifact(artifactId, { path: DOWNLOAD_PATH });
    } else if (parsed.name !== undefined) {
      const list = await client.listArtifacts();
      const found = list.artifacts.find((a) => a.name === parsed.name);
      if (!found) {
        throw new Error(`Artifact not found: ${parsed.name}`);
      }
      await client.downloadArtifact(found.id, { path: DOWNLOAD_PATH });
    } else if (parsed.pattern !== undefined) {
      const list = await client.listArtifacts();
      const pattern = parsed.pattern;
      const matched = list.artifacts.filter((a) => minimatch(a.name, pattern));
      if (matched.length === 0) {
        core.warning(`No artifacts matched pattern: ${pattern}`);
      }
      await this.downloadMatched(client, matched, mergeMultiple);
    } else {
      throw new Error(
        "artifact config must specify one of 'name', 'pattern', or 'id'",
      );
    }

    return path.join(DOWNLOAD_PATH, config.file);
  }

  private parseArtifactConfig(input: string): ArtifactConfig {
    try {
      const result = yaml.load(input);
      if (result !== null && typeof result === 'object') {
        return result as ArtifactConfig;
      }
    } catch {
      // fall through to JSON
    }
    try {
      return JSON.parse(input) as ArtifactConfig;
    } catch {
      throw new Error('Failed to parse artifact config as YAML or JSON');
    }
  }

  private async downloadMatched(
    client: DefaultArtifactClient,
    artifacts: Artifact[],
    mergeMultiple: boolean,
  ): Promise<void> {
    for (const artifact of artifacts) {
      const target = mergeMultiple
        ? DOWNLOAD_PATH
        : path.join(DOWNLOAD_PATH, artifact.name);
      await client.downloadArtifact(artifact.id, { path: target });
    }
  }
}
