import * as cron from "node-cron";
import * as fs from "fs";
import { Telegraf } from "telegraf";
import { Timetable, JobInfo } from "./entity/timetable";
import { RandomHelper } from "./utils/randomHelper";
import { HistoryRepository } from "./respository/history";

const token: string = "1714380462:AAEqH-fVp-3GTIMfQdDq8SMX4ANLuLLmbm8";
const client = new Telegraf(token)
const chatId: string = "-517845866";
const historyRepository = new HistoryRepository();

let todayJobs: Array<JobInfo> = [];
let allJobDoneMessageDisplayed: boolean = false;

async function main() {
    let initJobMessageDisplayed: boolean = false;

    client.command("/done", context => {
        var returnMsg: string;
        var username = context.from.username;

        if (username == undefined) {
            returnMsg = "⚠️在使用 /done 命令之前请设置 username!";
        } else {
            var jobInfo = todayJobs.find(jobInfo => jobInfo.username == username);
            if (historyRepository.addHistory(jobInfo.person, jobInfo.job)) {
                returnMsg = `@${username} 💗 谢谢你对这个家的付出！`
            } else {
                returnMsg = "⚠️/done 命令出错！";
            }
        }
        client.telegram.sendMessage(chatId, returnMsg);
    });
    client.launch();

    // Init Job
    todayJobs = getRandomJobs();

    // Notify if job havent done
    cron.schedule('* * 9,12,15,18 * * *', () => {
        // cron.schedule('*/10 * * * * *', () => {
        // Check is first time send job message
        if (initJobMessageDisplayed == false) {
            sendMessage(getInitJobsStr(todayJobs));
            initJobMessageDisplayed = true;
            console.log(initJobMessageDisplayed);
        } else {
            if (allJobDoneMessageDisplayed == false) {
                var remainingJobs = filterRemainingJobs(todayJobs);
                // Still have remaining jobs
                if (remainingJobs.length > 0) {
                    sendMessage(getNotifyJobsStr(remainingJobs));
                } else {
                    sendMessage("今日的家务已经完成！谢谢大家的付出 💗");
                    allJobDoneMessageDisplayed = true;
                }
            }
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kuala_Lumpur"
    });

    // Initialize everyday job
    cron.schedule('0 0 0 * * *', () => {
        todayJobs = getRandomJobs();
        initJobMessageDisplayed = false;
        allJobDoneMessageDisplayed = false;
    }, {
        scheduled: true,
        timezone: "Asia/Kuala_Lumpur"
    });

    console.log("Service Started.");

}

function filterRemainingJobs(jobs: Array<JobInfo>): Array<JobInfo> {
    var settledJobs: Set<string> = historyRepository.getTodayHistory();
    var unsettledJobs: Array<JobInfo> = [];
    for (var job of todayJobs) {
        if (settledJobs.has(job.person) == false) {
            unsettledJobs.push(job);
        }
    }
    return unsettledJobs;

}

function getRandomJobs(): Array<JobInfo> {
    const timetable = getTimeTable();
    const jobIndex = RandomHelper.getRandomNumber(timetable.data.length);
    const jobs = timetable.data[jobIndex].jobs;

    return jobs;
}

function getInitJobsStr(jobInfos: Array<JobInfo>): string {
    var jobInfos: Array<JobInfo> = getRandomJobs();
    var message: string = "🔔 温馨提醒 🔔 \n✅ 请在今天完成各自的家务 \n";
    for (var job of jobInfos) {
        message += `📌 @${job.username} ${job.person} → ${job.job}\n`;
    }
    return message;
}

function getNotifyJobsStr(jobInfos: Array<JobInfo>): string {
    var message: string = "🔔 温馨提醒 🔔 \n🕧 请各位尽快完成未完成的家务 \n";
    for (var job of jobInfos) {
        message += `📌 @${job.username} ${job.person} → ${job.job}\n`;
    }
    return message;
}

function getTimeTable(): Timetable {
    const timetableRaw = fs.readFileSync('./src/timetable.json',
        { encoding: 'utf8', flag: 'r' });
    let timetable: Timetable = JSON.parse(timetableRaw);
    return timetable;
}

async function sendMessage(message: string) {
    console.log(`Message sent to API: ${message}`)
    await client.telegram.sendMessage(chatId, message);
}

main()

