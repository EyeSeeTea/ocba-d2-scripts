import _ from "lodash";
import { getUid } from "data/dhis2-uid";
import { DateLib } from "../entities/DateLib";
import { Rand } from "./Rand";
import { Patient, Consultation, Closure } from "domain/entities/HivData";

export const config = {
    yearsInPast: 8,
    chunkSize: 100,
    patientsPerMonth: 50,
    maxConsultationsDefault: 8 * 12,
    closurePercentageDefault: 5,
    orgUnits: ["MALAKAL HIV - PoC - Linelist"],
    addresses: [
        "SOUTH SUDAN / MALAKAL / CANAL",
        "SOUTH SUDAN / MALAKAL / POAM",
        "SOUTH SUDAN / MALAKAL / GELACHEL",
        "SOUTH SUDAN / MALAKAL / ULANG",
        "SOUTH SUDAN / MALAKAL / MUDERIA",
        "SOUTH SUDAN / MALAKAL / KOLIET",
        "SOUTH SUDAN / MALAKAL / KHORWAI",
    ],
    reasonOfClosure: ["Lost to follow-up", "Dead"],
    typeOfVisit: "starts_art",
    ages: { min: 5, max: 80 },
    nextConsultationsDaysOffset: 5,
    advancedHivWhoStages: [3, 4],
    percentageOfAdvancedHiv: 20,
    percentageOfViralLoadPresence: 80,
    viralLoad: { min: 100, max: 100_000 },
    patientCode: "_prefix-HIV-MALAKAL-_suffix",
};

export type HivData = {
    patients: Patient[];
    buildConsultations: (patients: Patient[]) => Consultation[];
    buildClosures: (patients: Patient[], consultations: Consultation[]) => Closure[];
};

export class GenerateHivDataUseCase {
    constructor(
        private options: {
            maxPatients: number | undefined;
            maxConsultations: number;
            closurePercentage: number;
        }
    ) {}

    public execute(): HivData {
        return {
            patients: this.buildPatients(),
            buildConsultations: patients => this.buildConsultations(patients),
            buildClosures: (patients, consultations) => this.buildClosures(patients, consultations),
        };
    }

    private buildPatients(): Patient[] {
        const { maxPatients } = this.options;
        const year = new Date().getFullYear() - config.yearsInPast;
        const allDates = DateLib.getIntervalDatesByMonth({
            startDate: new Date(year, 0, 1),
            perMonth: config.patientsPerMonth,
        });
        const dates = maxPatients ? _.take(allDates, maxPatients) : allDates;

        return dates.map((enrollmentDate, index): Patient => {
            const { sample } = Rand;
            const patientId = getUid(`tei-${index}`);
            const age = Rand.random(`age-${index}`, config.ages.min, config.ages.max);

            return {
                id: patientId,
                enrollmentDate: enrollmentDate,
                age: age,
                currentWhoStage: sample(`whoStage-${patientId}`, [1, 2, 3]),
                arvLine: sample(`arvLine-${patientId}`, [1, 2, 3]),
                orgUnitName: sample(`orgUnit-${index}`, config.orgUnits),
                code: this.generateCode(index),
                address: sample(`address-${index}`, config.addresses),
                sex: sample(`sex-${index}`, ["Female", "Male"]),
                birthYear: new Date().getFullYear() - age,
            };
        });
    }

    private buildConsultations(patients: Patient[]): Consultation[] {
        return patients.flatMap(patient => {
            let consultationDate = new Date(patient.enrollmentDate);

            return _.range(0, this.options.maxConsultations).map((index): Consultation => {
                const { random } = Rand;
                const eventId = getUid(`event-consultation-${patient.id}-${index}`);

                const nextConsultationDate = new Date(consultationDate);
                nextConsultationDate.setMonth(nextConsultationDate.getMonth() + 1);
                const offset = config.nextConsultationsDaysOffset;
                const newConsultationDateDay =
                    nextConsultationDate.getDate() + random(`next-${index}`, -offset, +offset);
                nextConsultationDate.setDate(newConsultationDateDay);

                const ageAtConsultation = Math.max(
                    1,
                    new Date(consultationDate).getFullYear() - patient.birthYear
                );

                const advancedHiv =
                    ageAtConsultation < 5 ||
                    config.advancedHivWhoStages.includes(patient.currentWhoStage) ||
                    random(`advancedHiv-${index}`, 0, 100) < config.percentageOfAdvancedHiv;

                const viralLoad =
                    random(`hasViralLoad-${index}`, 0, 100) < config.percentageOfViralLoadPresence
                        ? undefined
                        : random(`viralLoad-${index}`, config.viralLoad.min, config.viralLoad.max);

                const consultation: Consultation = {
                    id: eventId,
                    patient: patient,
                    consultationDate: consultationDate,
                    nextConsultationDate: nextConsultationDate,
                    typeOfVisit: config.typeOfVisit,
                    advancedHiv: advancedHiv,
                    viralLoad: viralLoad,
                    arvLine: patient.arvLine,
                    ageAtConsultation: ageAtConsultation,
                    arv1StartDate: patient.arvLine === 1 ? patient.enrollmentDate : undefined,
                    arv2StartDate: patient.arvLine === 2 ? patient.enrollmentDate : undefined,
                    arv3StartDate: patient.arvLine === 3 ? patient.enrollmentDate : undefined,
                    pvlDate: viralLoad ? consultationDate : undefined,
                };

                consultationDate = nextConsultationDate;
                return consultation;
            });
        });
    }

    private buildClosures(patients: Patient[], consultations: Consultation[]): Closure[] {
        const { sample } = Rand;
        const closureCount = Math.max(1, (patients.length * this.options.closurePercentage) / 100);
        const patientsInClosure = _.take(patients, closureCount);

        return patientsInClosure.map((patient): Closure => {
            const lastConsultation = _.last(consultations.filter(c => c.patient.id === patient.id));
            if (!lastConsultation)
                throw new Error(`No consultation found for patient: ${patient.id}`);

            return {
                id: getUid(`event-closure-${patient.id}`),
                patient: patient,
                lastConsultation: lastConsultation,
                reason: sample(`reasonOfClosure-${patient.id}`, config.reasonOfClosure),
            };
        });
    }

    private generateCode(index: number): string {
        // From Excel formula: TEXT(20+INT((ROW()-1)/10),"00")&"-HIV-MALAKAL-"&TEXT(MOD(ROW()-1,10)+1,"00")
        const prefix = (20 + Math.floor((index - 1) / 10)).toString().padStart(2, "0");
        const suffix = (1 + ((index - 1) % 10)).toString().padStart(2, "0");
        return config.patientCode.replace("_prefix", prefix).replace("_suffix", suffix);
    }
}
