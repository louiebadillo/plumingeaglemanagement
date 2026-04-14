/**
 * Wraps a Dialog onClose handler so backdrop clicks and Escape do not close the modal.
 * Prevents spurious closes when switching browser tabs or from focus/pointer quirks.
 * Use explicit Cancel / Save buttons to dismiss entity edit forms.
 */
export function shieldEntityDialogClose(handler) {
  return (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }
    handler(event, reason);
  };
}
