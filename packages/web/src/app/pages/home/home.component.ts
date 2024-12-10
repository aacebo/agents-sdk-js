import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

import { IconModule } from '../../components/icon';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  host: { class: 'app-home' },
  imports: [IconModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home { }
