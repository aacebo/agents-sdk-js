import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ElapseTime } from './elapse-time.pipe';

@NgModule({
  declarations: [ElapseTime],
  exports: [ElapseTime],
  imports: [CommonModule]
})
export class ElapseTimeModule { }
