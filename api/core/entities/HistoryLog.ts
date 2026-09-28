import { Process } from "../enums/Process";

export class historyLog {
  logId: bigint;
  cashRegister: bigint;
  process: Process;

  constructor(logId: bigint, cashRegister: bigint, process: Process) {
    this.logId = logId;
    this.cashRegister = cashRegister;
    this.process = process;
  }
}
