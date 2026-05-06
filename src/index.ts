interface User {
  name: string;
  id: number | string;
}

const user = {
  name: "C",
  id: 1,
};

function hello(u: User): string {
  return "hello " + u.name;
}

console.log(hello(user));
