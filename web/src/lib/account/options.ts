export interface SelectOption {
  id: string;
  name: string;
}

export interface AdvisorOption extends SelectOption {
  schoolId: string | null;
}

export interface AccountOptions {
  classes: SelectOption[];
  advisors: AdvisorOption[];
}
