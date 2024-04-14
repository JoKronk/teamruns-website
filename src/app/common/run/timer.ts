
import { Subject } from 'rxjs';
import { RunState } from './run-state';

export class Timer {

  timeString: string;
  timeStringMs: string;
  countdownSeconds: number = 15;

  totalMs: number = 0;
  startDateMs: number | null;
  private pauseDateMs: number | null = null;
  private endTimeMs: number | null = null;

  private timerUpdateRateMs: number = 10;

  runState: RunState;
  timerSubject: Subject<RunState> = new Subject();

  private resetEverything: boolean = false; //used to flag a reset to the update cycle

  constructor() {
    this.resetTimer();
  }
  
  importTimer(timer: Timer) {
    this.timeString = timer.timeString;
    this.timeStringMs = timer.timeStringMs;
    this.startDateMs = timer.startDateMs;
    this.countdownSeconds = timer.countdownSeconds;
    this.totalMs = timer.totalMs;
    this.runState = timer.runState;
    this.resetEverything = timer.resetEverything;
  }

  setStartConditions(countdownSeconds: number) {
    this.countdownSeconds = countdownSeconds;
    this.resetTimer();
  }

  reset() {
    if (this.runIsOngoing())
      this.resetEverything = true;
    else
      this.resetTimer();
  }

  togglePause() { //!NOTE: Don't know if this can be relied up in runs due to start time ms dependancies, check before usage there
    if (!this.startDateMs) return;

    if (!this.pauseDateMs)
      this.pauseDateMs = new Date().getTime();
    else {
      var currentTimeMs = new Date().getTime();
      this.startDateMs += (currentTimeMs - this.pauseDateMs);
      this.pauseDateMs = null;
    }
  }

  updateRunState(state: RunState) {
    this.runState = state;
    this.timerSubject.next(this.runState);
  }

  isPaused() {
    return this.pauseDateMs !== null;
  }

  runIsOngoing() {
    return this.runState === RunState.Countdown || this.runState === RunState.CountdownSpawning || this.runState === RunState.Started;
  }

  inCountdown() {
    return this.runState === RunState.Countdown || this.runState === RunState.CountdownSpawning;
  }

  isPastCountdown() {
    return this.totalMs > 0 && this.runState === RunState.Started;
  }

  shiftTimerByMs(ms: number) {
    if (this.startDateMs)
      this.startDateMs += ms;
  }

  private resetTimer() {
    this.startDateMs = null;
    this.pauseDateMs = null;
    this.updateRunState(RunState.Waiting);
    this.timeString = "-0:00:" + ("0" + this.countdownSeconds).slice(-2);
    this.timeStringMs = ".0";
    this.totalMs = 0;
  }

  startTimer(startDateMs: number | null = null, endTimeMs: number | null = null) {
    this.resetEverything = false;

    if (!startDateMs) {
      let startDate = new Date();
      startDate.setSeconds(startDate.getSeconds() + (this.countdownSeconds > 0 ? (this.countdownSeconds - 1) : this.countdownSeconds));
      startDateMs = startDate.getTime();
    }
    this.startDateMs = startDateMs;
    this.endTimeMs = endTimeMs;
    this.updateRunState(RunState.Countdown);
    
    this.updateTimer();
  }



  async updateTimer() {
    if (this.runState === RunState.Ended)
      return;

    var currentTimeMs = new Date().getTime();


    //spawn check
    if (this.runState === RunState.Countdown && this.startDateMs! <= currentTimeMs + 1400)
    this.updateRunState(RunState.CountdownSpawning);
      
    //start run check
    if (this.runState === RunState.CountdownSpawning && this.startDateMs! <= currentTimeMs)
      this.updateRunState(RunState.Started);

    const newTotalTimeMs = currentTimeMs - this.startDateMs!
    const updateText: boolean = Math.floor(newTotalTimeMs / 100) !== Math.floor(this.totalMs / 100);

    if (!this.pauseDateMs)
      this.totalMs = newTotalTimeMs;
      

    //only update text if timer has increased by .1
    if (updateText) {
      this.timeString = this.runState === RunState.Started ? (Timer.msToTimeFormat(this.totalMs)) : ("-0:00:" + Timer.getSecond(this.totalMs));
      this.timeStringMs = "." + this.getMs(this.totalMs);
    }

    
    if (!this.endTimeMs || this.endTimeMs >= this.totalMs)
      await new Promise(r => setTimeout(r, this.timerUpdateRateMs));
    else {
      this.updateRunState(RunState.Ended);
      this.resetEverything = true;
    }

    if (this.resetEverything)
      this.resetTimer();
    else
      this.updateTimer();
  }



  private getMs(ms: number): number {
    return this.runState === RunState.Started ? Math.trunc(Math.floor((ms % 1000)) / 100) : Math.trunc(Math.abs(Math.floor((ms % 1000)) / 100));
  }

  public static getHour(ms: number): number {
      return Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  }
  public static getMinutes(ms: number): string {
      return ("0" + Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))).slice(-2);
  }

  public static getMinutesSimple(ms: number): number {
      return Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  }

  public static getSecond(ms: number): string {
      return ("0" + Math.abs(Math.floor((ms % (1000 * 60)) / 1000))).slice(-2);
  }

  public static getSecondSimple(ms: number): number {
      return Math.abs(Math.floor((ms % (1000 * 60)) / 1000));
  }

  public static getMsSimple(ms: number): number {
      return Math.trunc(Math.floor((ms % 1000)) / 100);
  }


  public static msToTimeFormat(ms: number, includeMs: boolean = false, shortenedFormat: boolean = false): string {
    let time: string = Timer.getHour(ms) + ":" + Timer.getMinutes(ms) + ":" + Timer.getSecond(ms);
    
    if (includeMs)
        time += "." + Math.trunc(Math.floor((ms % 1000)) / 100);
    
    if (shortenedFormat) {
        for (let i = 0; i < 3 && (time.charAt(0) === "0" || time.charAt(0) === ":"); i++)
        time = time.substring(1);
    }
    return time;
  }

  public static msToTextFormat(ms: number): string {
    let time: string = Timer.getHour(ms) + "h " + Timer.getMinutes(ms) + "m " + Timer.getSecond(ms) + "s";
    
    for (let i = 0; i < 3 && (time.charAt(0) === "0" || time.charAt(0) === "h" || time.charAt(0) === "m"); i++)
      time = time.substring(1);

    return time;
  }

  public static msToTimeTextFormat(ms: number) {
      let hour = Timer.getHour(ms);
      let time = "";
      if (hour)
          time += hour + "h ";
      time +=  + Timer.getMinutes(ms) + "m " + Timer.getSecond(ms) + "s";
      return time;
  }

  public static timeToMs(time: string): number {
      if (time === "DNF")
          return 0;
      let timeArray: number[] = time.replace(".", ":").split(":").map(x => +x).reverse();
      return (timeArray[0] * 100) + (timeArray[1] * 1000) + (!timeArray[2] ? 0 : timeArray[2] * 60000) + (!timeArray[3] ? 0 : timeArray[3] * 3600000);
  }

  onDestroy(): void {
    this.reset();
  }
}
