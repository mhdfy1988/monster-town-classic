const normalizeAssetPath = (path: string) => path.replace(/^\/+/, '');

/** 生成遵循 Vite base 的运行时公共素材地址，兼容本地根路径和 Pages 子路径。 */
export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}assets/${normalizeAssetPath(path)}`;
}
