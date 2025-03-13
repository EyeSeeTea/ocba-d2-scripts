import XlsxPopulate, { fromFileAsync } from "@eyeseetea/xlsx-populate";
import { DateLib } from "domain/entities/DateLib";
import _c from "domain/entities/generic/Collection";
import { Patient, Consultation, Closure } from "domain/entities/HivData";
import { HivData, config } from "domain/usecases/GenerateHivDataUseCase";

export class HIVDataSpreadsheetGenerator {
    sheetsBulkLoadInfo = {
        trackedEntities: { name: "TEI Instances", firstRow: 6 },
        consultationEvents: { name: "(1) HIV Consultation", firstRow: 3 },
        closureEvents: { name: "(2) Closure", firstRow: 3 },
    };

    sheets: Record<keyof typeof this.sheetsBulkLoadInfo, DataSheet>;

    constructor(private workbook: XlsxPopulate.Workbook) {
        const getSheet = (name: keyof typeof this.sheetsBulkLoadInfo): DataSheet => {
            const obj = this.sheetsBulkLoadInfo[name];
            const sheet = workbook.sheet(obj.name);
            if (!sheet) throw new Error(`Sheet not found: ${obj.name}`);
            return [sheet, obj.firstRow];
        };

        this.sheets = {
            trackedEntities: getSheet("trackedEntities"),
            consultationEvents: getSheet("consultationEvents"),
            closureEvents: getSheet("closureEvents"),
        };
    }

    public async execute(data: HivData, options: { output: string }): Promise<void> {
        const { patients } = data;
        const sheetsCount = Math.ceil(patients.length / config.chunkSize);

        const indexedGroups = _c(patients)
            .chunk(config.chunkSize)
            .enumerate()
            .map(([index, patientsGroup]) => ({
                index: index,
                patientsGroup: patientsGroup,
            }))
            .value();

        this.log(`patients: ${patients.length} (${sheetsCount} files)`);

        for (const item of indexedGroups) {
            const { index, patientsGroup } = item;

            const consultations = data.buildConsultations(patientsGroup);
            const closures = data.buildClosures(patientsGroup, consultations);

            this.generateTrackedEntitiesSheet(patientsGroup);
            this.generateConsultationsSheet(consultations);
            this.generateClosureSheet(closures);

            const indexWithPadding = (index + 1).toString().padStart(3, "0");
            const outputFileName = options.output.replace("INDEX", indexWithPadding);
            await this.workbook.toFileAsync(outputFileName);

            this.log(`Written: ${outputFileName}`);
        }
    }

    private log(message: string): void {
        console.info(message);
    }

    private generateTrackedEntitiesSheet(patients: Patient[]) {
        const [sheet, rowIndexStart] = this.sheets.trackedEntities;

        patients.forEach((patient, rowIndex) => {
            const row = sheet.row(rowIndexStart + rowIndex);

            row.cell("A").value(patient.id);
            row.cell("B").value(patient.orgUnitName);
            row.cell("D").value(DateLib.getIsoDate(patient.enrollmentDate));
            row.cell("E").value(DateLib.getIsoDate(patient.enrollmentDate));
            row.cell("F").value(patient.code);
            row.cell("G").value(patient.address);
            row.cell("J").value(patient.sex);
            row.cell("K").value(patient.birthYear);
            row.cell("L").value(patient.age);
        });
    }

    private generateConsultationsSheet(consultations: Consultation[]) {
        const [sheet, rowIndexStart] = this.sheets.consultationEvents;

        consultations.forEach((consultation, rowIndex) => {
            const { patient, consultationDate } = consultation;
            const row = sheet.row(rowIndexStart + rowIndex);

            row.cell("A").value(consultation.id);
            row.cell("B").value(patient.id);
            row.cell("C").value("default");
            row.cell("D").value(DateLib.getIsoDate(consultationDate));
            row.cell("E").value(DateLib.getIsoDate(consultation.nextConsultationDate));
            row.cell("F").value(consultation.ageAtConsultation);
            row.cell("G").value(config.typeOfVisit);
            row.cell("H").value(patient.currentWhoStage);
            row.cell("P").value(patient.arvLine);
            row.cell("Q").value(DateLib.getIsoDate(patient.enrollmentDate));

            row.cell("AC").value(consultation.advancedHiv ? "Yes" : "No");
            row.cell("AM").value(consultation.viralLoad);

            row.cell("AW").value(DateLib.getIsoDate(consultationDate));
            row.cell("AX").value(DateLib.getIsoDate(consultation.arv1StartDate));
            row.cell("AY").value(DateLib.getIsoDate(consultation.arv2StartDate));
            row.cell("AZ").value(DateLib.getIsoDate(consultation.arv3StartDate));
            row.cell("BA").value(DateLib.getIsoDate(consultation.pvlDate));
        });
    }

    private generateClosureSheet(closures: Closure[]) {
        const [sheet, rowIndexStart] = this.sheets.closureEvents;

        closures.forEach((closure, index) => {
            const row = sheet.row(rowIndexStart + index);
            const closureStrDate = DateLib.getIsoDate(closure.lastConsultation.consultationDate);

            row.cell("A").value(closure.id);
            row.cell("B").value(closure.patient.id);
            row.cell("C").value("default");
            row.cell("D").value(closureStrDate);
            row.cell("E").value(closure.patient.age);
            row.cell("F").value(closure.reason);
            row.cell("G").value(closureStrDate);
        });
    }

    static async build(options: Args): Promise<HIVDataSpreadsheetGenerator> {
        const workbook = await fromFileAsync(options.templateFile);
        return new HIVDataSpreadsheetGenerator(workbook);
    }
}

type Args = {
    templateFile: string;
    maxPatients: number | undefined;
    maxConsultations: number;
    closurePercentage: number;
    output: string;
};

type DataSheet = [sheet: XlsxPopulate.Sheet, firstRow: number];
