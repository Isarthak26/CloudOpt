export function ms(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2)} ms`;
}

export function percent(value) {
  if (value === null || value === undefined) return "—";
  return `${(Number(value) * 100).toFixed(2)}%`;
}

export function resources(cpuLimit, memoryLimitMb) {
  if (cpuLimit === null || cpuLimit === undefined) {
    return "no CPU/memory limit";
  }
  return `${cpuLimit} CPU / ${memoryLimitMb} MB`;
}

export function titleCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
