import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [NgClass],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDropdown {
  readonly id = input<string>('app-dropdown');
  readonly placeholder = input<string>('Select');
  readonly options = input<DropdownOption[]>([]);
  readonly value = input<string>('');

  readonly valueChange = output<string>();

  protected readonly hasValue = computed(() => !!this.value());

  protected onChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.valueChange.emit(select.value);
  }
}
