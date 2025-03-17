import { Rand } from "domain/usecases/Rand";

export class DateLib {
    static getIntervalDatesByMonth(options: { startDate: Date; perMonth: number }): Date[] {
        const { startDate, perMonth: numPerMonth } = options;

        const dates: Date[] = [];
        const currentDate = new Date();
        const current = new Date(startDate);

        while (current <= currentDate) {
            const year = current.getFullYear();
            const month = current.getMonth();

            for (let i = 0; i < numPerMonth; i++) {
                const randomDay = Rand.random(i.toString(), 1, 28);
                dates.push(new Date(year, month, randomDay));
            }

            current.setMonth(current.getMonth() + 1);
        }

        return dates;
    }

    static getIsoDate(date: Date | undefined): string | undefined {
        if (!date) return;
        const dateStr = date.toISOString().split("T")[0];
        if (!dateStr) throw new Error(`Invalid date: ${date}`);
        return dateStr;
    }
}
