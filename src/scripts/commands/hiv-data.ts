import { command, number, string, option, run, optional, subcommands } from "cmd-ts";
import { config, GenerateHivDataUseCase } from "domain/usecases/GenerateHivDataUseCase";
import { HIVDataSpreadsheetGenerator } from "./HIVDataSpreadsheetGenerator";

const cmd = command({
    name: "hiv-data-generator",
    args: {
        templateFile: option({ type: string, long: "template" }),
        maxPatients: option({ type: optional(number), long: "max-patients" }),
        maxConsultations: option({
            type: number,
            long: "max-consultations",
            defaultValue: () => config.maxConsultationsDefault,
        }),
        closurePercentage: option({
            type: number,
            long: "closure-percentage",
            defaultValue: () => config.closurePercentageDefault,
        }),
        output: option({ type: string, long: "output" }),
    },
    handler: async args => {
        const hivData = new GenerateHivDataUseCase(args).execute();
        const generator = await HIVDataSpreadsheetGenerator.build(args);
        await generator.execute(hivData, args);
    },
});

export const getCommand = () => subcommands({ name: "hiv-data", cmds: { generate: cmd } });
