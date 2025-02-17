<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { isNullish, nonNullish } from "@dfinity/utils";

  export let name: string;
  export let inputType: "icp" | "number" | "text" = "number";
  export let required = true;
  export let spellcheck: boolean | undefined = undefined;
  export let step: number | "any" | undefined = undefined;
  export let disabled = false;
  export let minLength: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let value: string | number | undefined = undefined;
  export let placeholder: string;
  export let testId: string | undefined = undefined;
  const dispatch = createEventDispatcher();

  // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
  export let autocomplete: "off" | "on" | undefined = undefined;

  // When forwarding slots, they always appear as true
  // This is a known issue in Svelte
  // https://github.com/sveltejs/svelte/issues/6059
  // To hack this, we pass a prop to avoid showing info element when not needed
  // Ideally, this would be calculated
  // showInfo = $$slots.label || $$slots.end
  export let showInfo = true;

  let inputElement: HTMLInputElement | undefined;

  $: step = inputType === "number" ? step ?? "any" : undefined;
  $: autocomplete = inputType !== "number" ? autocomplete ?? "off" : undefined;

  let selectionStart: number | null = 0;
  let selectionEnd: number | null = 0;

  // replace exponent format (1e-4) w/ plain (0.0001)
  const exponentToPlainNumberString = (value: string): string =>
    // number to toLocaleString doesn't support decimals for values >= ~1e16
    value.includes("e")
      ? Number(value).toLocaleString("en", {
          useGrouping: false,
          maximumFractionDigits: 8,
        })
      : value;
  // To show undefined as "" (because of the type="text")
  const fixUndefinedValue = (value: string | number | undefined): string =>
    isNullish(value) ? "" : `${value}`;

  let icpValue: string = exponentToPlainNumberString(fixUndefinedValue(value));
  let lastValidICPValue: string | number | undefined = value;
  let internalValueChange = true;

  $: value,
    (() => {
      if (!internalValueChange && inputType === "icp") {
        if (typeof value === "number") {
          icpValue = exponentToPlainNumberString(`${value}`);
        } else {
          icpValue = fixUndefinedValue(value);
        }

        lastValidICPValue = icpValue;
      }

      internalValueChange = false;
    })();

  const restoreFromValidValue = (noValue = false) => {
    if (isNullish(inputElement) || inputType !== "icp") {
      return;
    }

    if (noValue) {
      lastValidICPValue = undefined;
    }

    internalValueChange = true;
    value = isNullish(lastValidICPValue)
      ? undefined
      : typeof lastValidICPValue === "number"
      ? lastValidICPValue.toFixed(8)
      : +lastValidICPValue;
    icpValue = fixUndefinedValue(lastValidICPValue);

    // force dom update (because no active triggers)
    inputElement.value = icpValue;

    // restore cursor position
    inputElement.setSelectionRange(selectionStart, selectionEnd);
  };

  // The type declaration of the input event is neither defined in node types nor in svelte.
  // This extends the event with the currentTarget that is provided by the browser and that can be used to retrieve the input value.
  type InputEventHandler = Event & {
    currentTarget: EventTarget & HTMLInputElement;
  };

  const isValidICPFormat = (text: string): boolean =>
    /^[\d]*(\.[\d]{0,8})?$/.test(text);

  const handleInput = ({ currentTarget }: InputEventHandler) => {
    if (inputType === "icp") {
      const currentValue = exponentToPlainNumberString(currentTarget.value);

      // handle invalid input
      if (isValidICPFormat(currentValue) === false) {
        // restore value (e.g. to fix invalid paste)
        restoreFromValidValue();
      } else if (currentValue.length === 0) {
        // reset to undefined ("" => undefined)
        restoreFromValidValue(true);
      } else {
        lastValidICPValue = currentValue;
        icpValue = fixUndefinedValue(currentValue);

        internalValueChange = true;
        // for inputType="icp" value is a number
        // TODO: do we need to fix lost precision for too big for number inputs?
        value = +currentValue;
      }
    } else {
      internalValueChange = true;
      value =
        inputType === "number" ? +currentTarget.value : currentTarget.value;
    }

    dispatch("nnsInput");
  };

  const handleKeyDown = () => {
    if (isNullish(inputElement)) {
      return;
    }

    // preserve selection
    ({ selectionStart, selectionEnd } = inputElement);
  };

  $: step = inputType === "number" ? step ?? "any" : undefined;
  $: autocomplete =
    inputType !== "number" && inputType !== "icp"
      ? autocomplete ?? "off"
      : undefined;

  let displayInnerEnd: boolean;
  $: displayInnerEnd = nonNullish($$slots["inner-end"]);
</script>

<div class="input-block" class:disabled>
  {#if showInfo}
    <div class="info">
      <slot name="start" />
      <label class="label" for={name}><slot name="label" /></label>
      <slot name="end" />
    </div>
  {/if}
  <div class="input-field">
    <input
      bind:this={inputElement}
      data-tid={testId}
      type={inputType === "icp" ? "text" : inputType}
      {required}
      {spellcheck}
      {name}
      id={name}
      {step}
      {disabled}
      value={inputType === "icp" ? icpValue : value}
      minlength={minLength}
      {placeholder}
      {max}
      {autocomplete}
      on:blur
      on:focus
      on:input={handleInput}
      on:keydown={handleKeyDown}
      class:inner-end={displayInnerEnd}
    />
    {#if displayInnerEnd}
      <div class="inner-end-slot">
        <slot name="inner-end" />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @use "../styles/mixins/form";

  .input-block {
    position: relative;

    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--padding);

    width: var(--input-width);

    &.disabled {
      --disabled-color: rgba(var(--disable-contrast-rgb), 0.8);
      color: var(--disabled-color);

      input {
        border: var(--input-border-size) solid var(--disable);
        color: var(--disabled-color);
      }
    }

    color: var(--background-contrast);
    background: none;
  }

  .info {
    display: flex;
    justify-content: space-between;
    gap: var(--padding);

    .label {
      flex: 1 1 100%;
    }
  }

  input {
    @include form.input;
    width: 100%;

    font-size: inherit;

    padding: var(--padding-2x);
    box-sizing: border-box;

    border-radius: var(--border-radius);

    outline: none;
    appearance: none;
  }

  input[disabled] {
    cursor: text;
  }

  .input-field {
    position: relative;
  }

  .inner-end {
    padding-right: var(--input-padding-inner-end, 64px);
  }

  .inner-end-slot {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translate(0, -50%);
    padding: var(--padding) var(--padding-2x);
  }
</style>
