export function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function round(n: number, decimalPlaces: number) {
  const operand = 10 ** decimalPlaces;

  return Math.round((n + Number.EPSILON) * operand) / operand;
}

export function parseFromString(s: string, decimalPlaces: number) {
  const parsed = Number.parseFloat(s);

  return s.endsWith(".")
    ? parsed + Number.parseFloat("0." + "0".repeat(decimalPlaces - 1) + "1")
    : /\.0{2,}$/.test(s)
    ? parsed + Number.parseFloat("0." + s.substring(s.indexOf(".") + 1).replace(/0$/, "1"))
    : parsed;
}
