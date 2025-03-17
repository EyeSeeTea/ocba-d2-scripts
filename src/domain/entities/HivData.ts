export type Patient = {
    id: string;
    enrollmentDate: Date;
    age: number;
    currentWhoStage: number;
    arvLine: number;
    orgUnitName: string;
    code: string;
    address: string;
    sex: string;
    birthYear: number;
};

export type Consultation = {
    id: string;
    patient: Patient;
    consultationDate: Date;
    ageAtConsultation: number;
    nextConsultationDate: Date;
    typeOfVisit: string;
    advancedHiv: boolean;
    viralLoad: number | undefined;
    arvLine: number;
    arv1StartDate: Date | undefined;
    arv2StartDate: Date | undefined;
    arv3StartDate: Date | undefined;
    pvlDate: Date | undefined;
};

export type Closure = {
    id: string;
    patient: Patient;
    lastConsultation: Consultation;
    reason: string;
};
