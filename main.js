const fs = require("fs");
const polka = require("polka");

const tempFile = "/sys/class/thermal/thermal_zone0/temp";
const dataFile = "./data.json";

const getTemp = () => {
  let result;

  if (fs.existsSync(tempFile)) {
    try {
      const file = fs.readFileSync(tempFile, { encoding: "utf-8" });

      result = Number(file) / 1000;
    } catch {
      result = Number.NaN;
    }
  } else result = Number.NaN;

  return result;
};

const generateData = (temperature) => ({
  temperature,
  date: Date.now(),
});

const storeData = (temperature) => {
  if (fs.existsSync(dataFile)) {
    const rawData = fs.readFileSync(dataFile, { encoding: "utf-8" });
    const jsonData = JSON.parse(rawData);

    jsonData.push(generateData(temperature));

    fs.writeFileSync(dataFile, JSON.stringify(jsonData));
  } else {
    const data = [];
    data.push(generateData(temperature));
    fs.writeFileSync(dataFile, JSON.stringify(data));
  }
};

const doIt = () => {
  const temperature = getTemp();
  storeData(temperature);

  //   console.log(`Written new data! CPU: ${temperature}ºC`);
};

doIt();

setInterval(() => {
  doIt();
}, 10000);

polka()
  .get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync("./static/index.html", { encoding: "utf-8" }));
  })
  .get("/data", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    res.end(fs.readFileSync(dataFile));
  })
  .get("/now", (req, res) => {
    const temp = getTemp();

    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        temperature: temp,
        formatted: `${temp}ºC`,
      })
    );
  })
  .listen(8080, (err) => {
    if (err) throw err;
    console.log(`> Running on localhost:8080`);
  });
