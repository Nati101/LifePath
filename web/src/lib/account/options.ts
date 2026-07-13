export interface SelectOption {
  id: string;
  name: string;
}

export interface AccountOptions {
  schools: SelectOption[];
  advisors: SelectOption[];
}
