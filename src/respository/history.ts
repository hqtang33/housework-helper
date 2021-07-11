import * as Database from "better-sqlite3"
import { JobInfo } from "../entity/timetable";

export class HistoryRepository {
    private filename: string;
    public database: any;

    constructor() {
        this.filename = "data.db";
        this.database = new Database(this.filename);

        this.migrate();
    }


    private migrate() {
        var sql: string = `
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    person TEXT NOT NULL,
                    job TEXT NOT NULL,
                    created_date DATE DEFAULT (date('now','localtime'))
                )
            `;
        const stmt = this.database.prepare(sql);
        const info = stmt.run();
    }

    public addHistory(person: string, job: string): boolean {

        var sql: string = "INSERT INTO history (person, job) VALUES (?,?)";
        const stmt = this.database.prepare(sql);
        const info = stmt.run(person, job);
        return true;
    }

    public getTodayHistory(): Set<string> {
        var set: Set<string> = new Set();
        var sql: string = "SELECT person FROM history WHERE created_date = (date('now','localtime'))";
        var stmt = this.database.prepare(sql);
        var infos: Array<JobInfo> = stmt.all();

        for (var info of infos) {
            set.add(info.person);
        }

        return set;
    }
}