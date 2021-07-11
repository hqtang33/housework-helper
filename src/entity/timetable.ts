export interface JobInfo {
    username: string;
    person: string;
    job: string;
};

export interface Jobs {
    jobs: Array<JobInfo>;
}

export interface Timetable {
    data: Array<Jobs>;
}