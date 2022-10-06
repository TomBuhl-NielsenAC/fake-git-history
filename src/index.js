const { exec } = require("child_process");
const util = require("util");
const { existsSync } = require("fs");
const execAsync = util.promisify(exec);
const {
  parse,
  addDays,
  addYears,
  isWeekend,
  setHours,
  setMinutes,
  setSeconds
} = require("date-fns");
const chalk = require("chalk");
const ora = require("ora");
const boxen = require("boxen");

module.exports = function({ commitsPerDay, workdaysOnly, startDate, endDate }) {
  const commitDateList = createCommitDateList({
    workdaysOnly,
    commitsPerDay: commitsPerDay.split(","),
    startDate: startDate ? parse(startDate) : addYears(new Date(), -1),
    endDate: endDate ? parse(endDate) : new Date()
  });

  (async function() {
    const spinner = ora("Generating your GitHub activity\n").start();

    const historyFolder = "my-history";

    // Remove git history folder in case if it already exists.
    if (existsSync(`./${historyFolder}`)) {
      await execAsync(
        `${
          process.platform === "win32" ? "rmdir /s /q" : "rm -rf"
        } ${historyFolder}`
      );
    }

    // Create git history folder.
    await execAsync(`mkdir ${historyFolder}`);
    process.chdir(historyFolder);
    await execAsync(`git init`);

    // Create commits.
    for (let i = 0; i < commitDateList.length; i++) {
      const date = commitDateList[i];
      const commitMsg = `TG-${i + 1}`;

      // Change spinner so user can get the progress right now.
      const dateFormatted = new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date);
      spinner.text = `Generating your Github activity... (${dateFormatted})\n`;

      await execAsync(`echo "${date}" > foo.txt`);
      await execAsync(`git add .`);
      await execAsync(`git commit --quiet --date "${date}" -m "${commitMsg}"`);
    }

    spinner.succeed();

    console.log(
      boxen(
        `${chalk.green("Success")} ${
          commitDateList.length
        } commits have been created.`,
        { borderColor: "yellow", padding: 1, align: "center" }
      )
    );
  })();
};

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createCommitDateList({
  commitsPerDay,
  workdaysOnly,
  startDate,
  endDate
}) {
  const commitDateList = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    if (workdaysOnly && isWeekend(currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }
    for (let i = 0; i < getRandomIntInclusive(...commitsPerDay); i++) {
      const dateWithHours = setHours(currentDate, getRandomIntInclusive(9, 16));
      const dateWithHoursAndMinutes = setMinutes(
        dateWithHours,
        getRandomIntInclusive(0, 59)
      );
      const commitDate = setSeconds(
        dateWithHoursAndMinutes,
        getRandomIntInclusive(0, 59)
      );

      commitDateList.push(commitDate);
    }
    currentDate = addDays(currentDate, 1);
  }

  return commitDateList;
}
