import { compare } from 'compare-versions';
import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';
import { toDotPath } from 'zod/v4/core';

<<<<<<< HEAD
export type JsonPatchOperation = {
  op: 'replace' | 'delta' | 'insert' | 'remove' | 'move';
  path?: string;
  value?: any;
  from?: string;
  to?: string;
};

=======
>>>>>>> 951ccd9ef4542130071c3067b09bef4651ce8128
export function assignInplace<T>(destination: T[], new_array: T[]): T[] {
  destination.length = 0;
  destination.push(...new_array);
  return destination;
}

// 修正 _.merge 对数组的合并逻辑, [1, 2, 3] 和 [4, 5] 合并后变成 [4, 5] 而不是 [4, 5, 3]
export function correctlyMerge<TObject, TSource>(lhs: TObject, rhs: TSource): TObject & TSource {
  return _.mergeWith(lhs, rhs, (_lhs, rhs) => (_.isArray(rhs) ? rhs : undefined));
}

export function chunkBy<T>(array: T[], predicate: (lhs: T, rhs: T) => boolean): T[][] {
  if (array.length === 0) {
    return [];
  }

  const chunks: T[][] = [[array[0]]];
  for (const [lhs, rhs] of _.zip(_.dropRight(array), _.drop(array))) {
    if (predicate(lhs!, rhs!)) {
      chunks[chunks.length - 1].push(rhs!);
    } else {
      chunks.push([rhs!]);
    }
  }
  return chunks;
}

export function regexFromString(input: string, replace_macros?: boolean): RegExp | null {
  if (!input) {
    return null;
  }
  const makeRegex = (pattern: string, flags: string) => {
    if (replace_macros) {
      pattern = substitudeMacros(pattern);
    }
    return new RegExp(pattern, flags);
  };
  try {
    const match = input.match(/\/(.+)\/([a-z]*)/i);
    if (!match) {
      return makeRegex(_.escapeRegExp(input), 'i');
    }
    if (match[2] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(match[3])) {
      return makeRegex(input, 'i');
    }
    let flags = match[2] ?? '';
    _.pull(flags, 'g');
    if (flags.indexOf('i') === -1) {
      flags = flags + 'i';
    }
    return makeRegex(match[1], flags);
  } catch {
    return null;
  }
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function checkMinimumVersion(expected: string, title: string) {
  if (compare(await getTavernHelperVersion(), expected, '<')) {
    toastr.error(`'${title}' 需要酒馆助手版本 >= '${expected}'`, '版本不兼容');
  }
}

export function prettifyErrorWithInput(error: z.ZodError) {
  return _([...error.issues])
    .sortBy(issue => issue.path?.length ?? 0)
    .flatMap(issue => {
      const lines = [`✖ ${issue.message}`];
      if (issue.path?.length) {
        lines.push(`  → 路径: ${toDotPath(issue.path)}`);
      }
      if (issue.input !== undefined) {
        lines.push(`  → 输入: ${JSON.stringify(issue.input)}`);
      }
      return lines;
    })
    .join('\n');
}

export function literalYamlify(value: any) {
  return YAML.stringify(value, { blockQuote: 'literal' });
}

<<<<<<< HEAD
export function decodeJsonPointer(path: string) {
  return path
    .split('/')
    .slice(1)
    .map(segment => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

export function encodeJsonPointer(segments: string[]) {
  return `/${segments.map(segment => segment.replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`;
}

export function removeByPointer(target: Record<string, any>, path: string) {
  const segments = decodeJsonPointer(path);
  const last = segments.pop();
  if (last === undefined) return;

  const parent = segments.length ? _.get(target, segments) : target;
  if (Array.isArray(parent)) {
    const index = Number(last);
    if (!Number.isNaN(index)) parent.splice(index, 1);
    return;
  }

  if (_.isObject(parent)) {
    delete (parent as Record<string, any>)[last];
  }
}

export function insertByPointer(target: Record<string, any>, path: string, value: any) {
  const segments = decodeJsonPointer(path);
  const last = segments.pop();
  if (last === undefined) return;

  const parent = segments.length ? _.get(target, segments) : target;
  if (Array.isArray(parent)) {
    if (last === '-') {
      parent.push(value);
      return;
    }

    const index = Number(last);
    if (!Number.isNaN(index)) {
      parent.splice(index, 0, value);
    }
    return;
  }

  _.set(target, [...segments, last], value);
}

export function moveByPointer(target: Record<string, any>, from: string, to: string) {
  const value = _.get(target, decodeJsonPointer(from));
  removeByPointer(target, from);
  insertByPointer(target, to, value);
}

function parseJsonPatchOperationArray(content: string) {
  const parsers = [
    () => JSON.parse(content),
    () => JSON5.parse(content),
    () => JSON.parse(jsonrepair(content)),
  ];

  for (const parser of parsers) {
    try {
      const parsed = parser();
      if (Array.isArray(parsed)) {
        return parsed as JsonPatchOperation[];
      }
    } catch {
      // continue trying the next parser
    }
  }

  return [] as JsonPatchOperation[];
}

export function parseLatestJsonPatch(message: string) {
  const matches = [...String(message ?? '').matchAll(/<JSONPatch>\s*([\s\S]*?)\s*<\/JSONPatch>/gi)];
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const parsed = parseJsonPatchOperationArray(matches[index][1]);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [] as JsonPatchOperation[];
}

export function normalizeAssistantMessageForMvuParsing(message: string) {
  const source = String(message ?? '');
  const withoutPlanningBlock = source.replace(/<konatan_planning~?>[\s\S]*?<\/konatan_planning~?>/gi, ' ');
  const withoutTucaoBlock = withoutPlanningBlock.replace(/<tucao>[\s\S]*?<\/tucao>/gi, ' ');
  const updateBlocks = [...withoutTucaoBlock.matchAll(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi)].map(match => match[0]);
  const formalBlocks = updateBlocks.filter(block => /<JSONPatch>\s*[\s\S]*?<\/JSONPatch>/i.test(block));

  if (formalBlocks.length === 0) {
    return withoutTucaoBlock;
  }

  const narrativeOnly = withoutTucaoBlock.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, ' ').trim();
  return `${narrativeOnly}\n\n${formalBlocks[formalBlocks.length - 1]}`.trim();
}

=======
>>>>>>> 951ccd9ef4542130071c3067b09bef4651ce8128
export function parseString(content: string): any {
  const json_first = /^[[{]/s.test(content.trimStart());
  try {
    if (json_first) {
      throw Error(`expected error`);
    }
    return YAML.parseDocument(content, { merge: true }).toJS();
  } catch (yaml_error1) {
    try {
      // eslint-disable-next-line import-x/no-named-as-default-member
      return JSON5.parse(content);
    } catch (json5_error) {
      try {
        return JSON.parse(jsonrepair(content));
      } catch (json_error) {
        try {
          if (!json_first) {
            throw Error(`expected error`);
          }
          return YAML.parseDocument(content, { merge: true }).toJS();
        } catch (yaml_error2) {
          const toError = (error: unknown) =>
            error instanceof Error ? `${error.stack ? error.stack : error.message}` : String(error);

          throw new Error(
            literalYamlify({
              ['要解析的字符串不是有效的 YAML/JSON/JSON5 格式']: {
                字符串内容: content,
                YAML错误信息: toError(json_first ? yaml_error2 : yaml_error1),
                JSON5错误信息: toError(json5_error),
                JSON错误信息: toError(json_error),
              },
            }),
          );
        }
      }
    }
  }
}
