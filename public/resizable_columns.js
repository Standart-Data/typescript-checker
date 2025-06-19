class ResizableColumns {
  constructor(
    container,
    leftColumn,
    middleColumn,
    rightColumn,
    resizerLeft,
    resizerRight
  ) {
    this.container = container;

    this.leftColumn = leftColumn;
    this.middleColumn = middleColumn;
    this.rightColumn = rightColumn;

    this.resizerLeft = resizerLeft;
    this.resizerRight = resizerRight;

    this.deltaOne = 0;
    this.deltaTwo = 0;

    this.resizerWidth = 7;

    this.isResizing = false;
    this.currentX = 0;
    this.initialWidths = {};
    this.currentResizer = null;

    this.resizerLeft.addEventListener("mousedown", (e) =>
      this.startResizing(e, this.resizerLeft)
    );
    this.resizerRight.addEventListener("mousedown", (e) =>
      this.startResizing(e, this.resizerRight)
    );

    window.addEventListener("mousemove", (e) => this.resizing(e));
    window.addEventListener("mouseup", () => this.endResizing());
    window.addEventListener("resize", () => this.resizeHandler());
    window.addEventListener("DOMContentLoaded", () => this.setInitialWidths());
  }

  startResizing(e, resizer) {
    this.isResizing = true;
    this.currentX = e.clientX;
    this.currentResizer = resizer;

    this.initialWidths = {
      left: this.leftColumn.offsetWidth,
      middle: this.middleColumn.offsetWidth,
      right: this.rightColumn.offsetWidth,
    };
    e.preventDefault();
  }

  resizing(e) {
    if (!this.isResizing) return;

    let newLeftWidth, newMiddleWidth, newRightWidth;

    if (this.currentResizer === this.resizerLeft) {
      this.deltaOne = e.clientX - this.currentX;

      newLeftWidth = this.initialWidths.left + this.deltaOne;
      newMiddleWidth = this.initialWidths.middle - this.deltaOne;

      this.leftColumn.style.width = newLeftWidth + "px";
      this.middleColumn.style.width = newMiddleWidth + "px";
    } else if (this.currentResizer === this.resizerRight) {
      this.deltaTwo = e.clientX - this.currentX;

      newMiddleWidth = this.initialWidths.middle + this.deltaTwo;
      newRightWidth = this.initialWidths.right - this.deltaTwo;

      this.middleColumn.style.width = newMiddleWidth + "px";
      this.rightColumn.style.width = newRightWidth + "px";
    }
  }

  endResizing() {
    this.isResizing = false;
    this.currentResizer = null;
  }

  setInitialWidths() {
    const containerWidth = this.container.offsetWidth;

    if (containerWidth < 640) {
      this.leftColumn.style.width = "100%";
      this.middleColumn.style.width = "100%";
      this.rightColumn.style.width = "100%";

      this.resizerLeft.style.display = "None";
      this.resizerRight.style.display = "None";

      return;
    }

    if (containerWidth >= 640 && containerWidth < 1024) {
      const initialWidth = (containerWidth - (this.resizerWidth + 5)) / 2;

      this.leftColumn.style.width = initialWidth + "px";
      this.middleColumn.style.width = initialWidth + "px";

      this.resizerLeft.style.display = "Block";
      this.resizerRight.style.display = "None";
      return;
    }

    const initialWidth = (containerWidth - (this.resizerWidth * 2 + 5)) / 3;
    this.leftColumn.style.width = initialWidth + "px";
    this.middleColumn.style.width = initialWidth + "px";
    this.rightColumn.style.width = initialWidth + "px";

    this.resizerLeft.style.display = "Block";
    this.resizerRight.style.display = "Block";
  }

  resizeHandler() {
    this.setInitialWidths();
  }
}
