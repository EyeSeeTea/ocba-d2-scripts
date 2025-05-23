import path from "path";
import { run, subcommands } from "cmd-ts";

import * as users from "./commands/users";
import * as closePatients from "./commands/patients";
import * as hivGenerator from "./commands/hiv-data";

export function runCli() {
    const cliSubcommands = subcommands({
        name: path.basename(__filename),
        cmds: {
            "hiv-data": hivGenerator.getCommand(),
            users: users.getCommand(),
            patients: closePatients.getCommand(),
        },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}
