const logger = function <T>(data: T): T {
  return data;
};

const numberTypeResult = logger(10 * 2);

const stringer = function () {
  return "sa" + "ba";
};

const sasa = stringer();
