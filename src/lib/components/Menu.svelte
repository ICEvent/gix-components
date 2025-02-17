<script lang="ts">
  import MenuBackground from "./MenuBackground.svelte";
  import { layoutMenuOpen } from "$lib/stores/layout.store";
  import { handleKeyPress } from "$lib/utils/keyboard.utils";
  import IconBack from "$lib/icons/IconBack.svelte";
  import { menuCollapsed, menuStore } from "$lib/stores/menu.store";
  import { i18n } from "$lib/stores/i18n";

  export let sticky = true;

  const close = () => layoutMenuOpen.set(false);
</script>

<div role="menu" class:open={$layoutMenuOpen}>
  <MenuBackground />

  <div
    class="inner"
    class:sticky
    data-tid="menu-inner"
    class:open={$layoutMenuOpen}
    role="button"
    tabindex="-1"
    on:click={close}
    on:keypress={($event) => handleKeyPress({ $event, callback: close })}
  >
    <slot />
  </div>

  <button
    class="menu-collapse icon-only"
    data-tid="menu-collapse"
    title={$menuCollapsed ? $i18n.core.expand : $i18n.core.collapse}
    on:click={menuStore.toggle}><IconBack /></button
  >
</div>

<style lang="scss">
  @use "../styles/mixins/interaction";
  @use "../styles/mixins/display";
  @use "../styles/mixins/media";

  div[role="menu"] {
    @include interaction.initial;

    box-sizing: border-box;

    z-index: var(--menu-z-index);

    --menu-logo-height: 65px;

    padding-top: calc(
      var(--menu-logo-height) + var(--padding-4x) + var(--header-offset, 0px)
    );

    // Shift the menu on large screen e.g. if a banner is displayed
    @include media.min-width(large) {
      padding-top: calc(
        var(--menu-logo-height) + var(--padding-3x) + var(--header-offset, 0px)
      );
    }

    position: relative;
  }

  .inner {
    display: flex;
    flex-direction: column;

    width: 0;
    max-width: 100vw;
    height: 100%;

    overflow-y: auto;

    margin-left: -100%;

    &.sticky {
      // On large screen the menu can be always open
      @include media.min-width(large) {
        width: var(--menu-width);
        margin-left: 0;
      }
    }

    // On smaller screen the menu is open on demand
    &.open {
      width: var(--menu-width);
      margin-left: 0;
    }

    transition:
      margin-left var(--animation-time-normal)
        var(--menu-animation-timing-function),
      width var(--animation-time-normal) var(--menu-animation-timing-function);

    // On large screen the header is not sticky but within the content that's why we align the inner menu start
    box-sizing: border-box;

    @include media.min-width(large) {
      padding-top: var(--padding-4x);
    }
  }
</style>
