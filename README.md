# Close patients: lost to follow-up

Create a completed closure program stage and complete enrollment on patients whose last consultation date is older than the current date minus a time of reference in days and whose enrollment occurred between an optional start date and end date. Those patients also cannot have any closure program stage or enrollment completed.

```console
shell:~$ yarn start patients close --url='http://USER:PASSWORD@localhost:8080' \
  --org-units-ids=bDx6cyWahq4 \
  --start-date=2022-01-01 \
  --end-date=2022-12-31 \
  --tracker-program-id=ORvg6A5ed7z \
  --program-stages-ids=tmsr4EJaSPz \
  --closure-program-id=XuThsezwYbZ \
  --time-of-reference=90 \
  --pairs-de-value=B2djsn1DVCj-1,qbZ8eKRUxYT-2 \
  --comments=SoLScs3kn7E-Comment \
  --save-report=affected-patients.csv
  [--post]
```

To not send the payload and just display it, do not add the `--post` flag.

See issue https://app.clickup.com/t/3ec3qa5 for more information

## Notes

If a program rule gives an error it will appear like on this example:

`11:29:25.192 ERROR POST /tracker: "Generated by program rule ('m8YFYXQOhw4') - Unable to assign value to data element 'g5FsMMsjI55'. The provided value must be empty or match the calculated value '2022-10-04'"`

The closure program stages always include Age at enrollment (added by program rules). If it is added on the command, it will throw the above error if it's not the expected one.

# HIV Data Generator Documentation

## Overview

The HIV Data Generator is a Node/TS script that generates synthetic HIV patient data. It creates Excel files ready to be imported by Bulk Load.

## System Requirements

### Setup

```sh
$ git clone https://github.com/eyeseetea/ocba-d2-scripts
$ cd ocba-d2-scripts
$ nvm use
$ yarn install
```

## Usage

### Basic Usage

Using bundled xlsx (hiv-bl-template.xlsx):

```sh
$ yarn start hiv-data generate --template src/scripts/commands/hiv-bl-template.xlsx --output "hiv-data-INDEX.xlsx"
```

Notes:

-   Use your own xlsx template (bulk-load -> Download Template -> Select program "HIV" + select orgUnit (example: "MALAKAL HIV - PoC - Linelist") + [Download template])
-   Literal `INDEX` will be replaced in the output path for the current file index.

### Command Line Arguments

-   `--template`: Path to the HIV Bulk Load template Excel file (required)
-   `--max-consultations`: Maximum number of consultations per patient (default: 50)
-   `--max-tracked-entities`: Maximum number of tracked entities to generate (default: no limit)
-   `--closure-percentage`: Percentage of patients to include in closure sheet (default: 5%)
-   `--output`: Custom output Excel file path (required) with index interpolation. Example: `out-INDEX.xlsx`

## Output

The script generates an Excel file ready to be imported in Bulk Load. It contains three data sheets:

1. **TEI Instances:** Tracked entities / Enrollment data
2. **(1) HIV Consultation:** Consultation events
3. **(2) Closure:** Closure events

## Data Validation Rules

-   WHO Stage 3 or 4 automatically sets **Advanced HIV (AHD)** to "Yes"
-   Viral load is generated for all patients with **Advanced HIV (AHD) = "Yes"**
-   Consultation dates are sequential and monthly
-   Closure percentage determines how many patients have closure records

## Import

Now in bulk-load:

```sh
$ git clone https://github.com/eyeseetea/bulk-load
$ cd bulk-load
$ git checkout v3.26.0
$ nvm use
$ yarn install
```

Import all generate xlsx files (a JSON report file will be generated for each imported file)

```sh
for file in hiv-data-*xlsx; do
    npx ts-node src/scripts/import-multiple-files.ts \
    --dhis2-url 'http://USER:PASSWORD@172.16.1.1:8093' \
    --results-path ./ \
    "$file"
done
```
