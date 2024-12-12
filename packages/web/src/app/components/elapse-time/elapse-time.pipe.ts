import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNowStrict, formatDuration } from 'date-fns';

@Pipe({
  name: 'elapseTime',
  standalone: false
})
export class ElapseTime implements PipeTransform {
  transform(v: Date | string | number | undefined | null) {
    if (!v) return '';

    if (typeof v === 'number') {
      return formatDuration({ seconds: v / 1000 });
    }

    return formatDistanceToNowStrict(new Date(v));
  }
}
