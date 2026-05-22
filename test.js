const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.car.count().then(c => {
  console.log("count:", c);
  p.$disconnect();
}).catch(e => {
  console.error("ERROR:", e);
  p.$disconnect();
});
