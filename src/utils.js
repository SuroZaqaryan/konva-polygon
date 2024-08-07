export function flattenArray(arr) {
  let result = [];

  arr.forEach(element => {
    if (Array.isArray(element)) {
      result = result.concat(flattenArray(element)); // рекурсивно объединяем элементы
    } else {
      result.push(element);
    }
  });

  return result;
}