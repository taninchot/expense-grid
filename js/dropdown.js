/**
 * Searchable Dropdown Component
 */

class SearchableDropdown {
  constructor(options) {
    this.id = options.id; // The base ID (e.g., 'sub-currency')
    this.data = options.data; // Array of objects { value, label, sublabel }
    this.onSelect = options.onSelect;
    this.selectedValue = options.value || "";

    this.container = document.getElementById(`${this.id}-dropdown`);
    this.trigger = document.getElementById(`${this.id}-trigger`);
    this.menu = document.getElementById(`${this.id}-menu`);
    this.search = document.getElementById(`${this.id}-search`);
    this.optionsContainer = document.getElementById(`${this.id}-options`);
    this.valueDisplay = document.getElementById(`${this.id}-value`);
    this.hiddenInput = document.getElementById(`${this.id}`);

    this.isOpen = false;
    this.init();
  }

  init() {
    this.renderOptions(this.data);

    // Toggle menu
    this.trigger.addEventListener("click", () => this.toggle());

    // Search functionality
    this.search.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = this.data.filter(
        (item) =>
          item.label.toLowerCase().includes(term) ||
          item.value.toLowerCase().includes(term) ||
          (item.sublabel && item.sublabel.toLowerCase().includes(term))
      );
      this.renderOptions(filtered);
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });

    // Sync initial value
    if (this.selectedValue) {
      this.setValue(this.selectedValue, false);
    }
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.menu.classList.add("active");
    this.search.focus();
  }

  close() {
    this.isOpen = false;
    this.menu.classList.remove("active");
    this.search.value = "";
    this.renderOptions(this.data);
  }

  renderOptions(items) {
    this.optionsContainer.innerHTML = "";

    if (items.length === 0) {
      this.optionsContainer.innerHTML = `
        <div class="p-4 text-center text-slate-400 text-sm">
          No results found
        </div>
      `;
      return;
    }

    items.forEach((item) => {
      const option = document.createElement("div");
      option.className = `dropdown-option flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 ${
        item.value === this.selectedValue ? "selected" : ""
      }`;

      const labelHtml = `
        <div class="flex flex-col">
          <span>${item.label}</span>
          ${
            item.sublabel
              ? `<span class="text-[10px] font-medium text-slate-400 opacity-70">${item.sublabel}</span>`
              : ""
          }
        </div>
      `;

      option.innerHTML = `
        <div class="flex items-center gap-2">
          ${labelHtml}
        </div>
        ${
          item.value === this.selectedValue
            ? '<span class="iconify h-4 w-4 text-indigo-600" data-icon="ph:check-bold"></span>'
            : ""
        }
      `;

      option.onclick = () => {
        this.setValue(item.value);
        this.close();
      };

      this.optionsContainer.appendChild(option);
    });
  }

  setValue(value, triggerCallback = true) {
    const item = this.data.find((i) => i.value === value);
    if (!item) return;

    this.selectedValue = value;
    this.hiddenInput.value = value;
    this.valueDisplay.innerText = item.label;

    // Highlight selected in list
    this.renderOptions(this.data);

    if (triggerCallback && this.onSelect) {
      this.onSelect(value);
    }

    // Dispatch change event to hidden input for compatibility with existing listeners
    this.hiddenInput.dispatchEvent(new Event("change"));
  }
}

window.SearchableDropdown = SearchableDropdown;
