const { getBeerReleases } = require("./beer_release");

const getBeerReleasesPromisified = (...args) => {
  return new Promise((resolve, reject) => {
    getBeerReleases(...args, resolve);
  });
};

test("Can fetch data from api", async () => {
  const from = new Date("2020-10-28");
  const to = new Date("2020-10-28");
  const releases = await getBeerReleasesPromisified(from, to);
  expect(releases).toMatchSnapshot()
});
