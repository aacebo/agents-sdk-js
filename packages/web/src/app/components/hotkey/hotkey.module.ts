import { NgModule } from '@angular/core';

import { HotKey } from './hotkey.directive';

@NgModule({
  declarations: [HotKey],
  exports: [HotKey],
})
export class HotKeyModule {}
