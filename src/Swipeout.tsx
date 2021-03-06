import React from 'react';
import ReactDOM from 'react-dom';
import Hammer from 'rc-hammerjs';
import omit from 'object.omit';
import SwipeoutPropType from './PropTypes';

class Swipeout extends React.Component <SwipeoutPropType, any> {
  static defaultProps = {
    prefixCls: 'rc-swipeout',
    autoClose: false,
    disabled: false,
    left: [],
    right: [],
    onOpen() {},
    onClose() {},
  };

  openedLeft: boolean;
  openedRight: boolean;
  content: any;
  cover: any;
  left: any;
  right: any;
  btnsLeftWidth: number;
  btnsRightWidth: number;
  panStartX: number;
  panStartY: number;
  swiping: boolean;

  constructor(props) {
    super(props);

    this.onPanStart = this.onPanStart.bind(this);
    this.onPan = this.onPan.bind(this);
    this.onPanEnd = this.onPanEnd.bind(this);
    this.onCloseSwipe = this.onCloseSwipe.bind(this);

    this.openedLeft = false;
    this.openedRight = false;
  }

  componentDidMount() {
    this.btnsLeftWidth = this.left ? this.left.offsetWidth : 0;
    this.btnsRightWidth = this.right ? this.right.offsetWidth : 0;
    document.body.addEventListener('touchstart', this.onCloseSwipe, true);
  }

  componentWillUnmount() {
    document.body.removeEventListener('touchstart', this.onCloseSwipe, true);
  }

  onCloseSwipe(ev) {
    if (this.openedLeft || this.openedRight) {
      const pNode = (node => {
        while (node.parentNode && node.parentNode !== document.body) {
          if (node.className.indexOf(`${this.props.prefixCls}-actions`) > -1) {
            return node;
          }
          node = node.parentNode;
        }
      })(ev.target);
      if (!pNode) {
        ev.preventDefault();
        this.close();
      }
    }
  }

  onPanStart(e) {
    this.panStartX = e.deltaX;
    this.panStartY = e.deltaY;
  }

  onPan(e) {
    const posX = e.deltaX - this.panStartX;
    const posY = e.deltaY - this.panStartY;

    if (Math.abs(posX) <= Math.abs(posY)) {
      return;
    }

    const { left, right } = this.props;
    if (posX < 0 && right!.length) {
      this.swiping = true;
      this._setStyle(Math.min(posX, 0));
    } else if (posX > 0 && left!.length) {
      this.swiping = true;
      this._setStyle(Math.max(posX, 0));
    }
  }

  onPanEnd(e) {
    if (!this.swiping) {
      return;
    }
    this.swiping = false;

    const { left = [], right = [] } = this.props;
    const btnsLeftWidth = this.btnsLeftWidth;
    const btnsRightWidth = this.btnsRightWidth;
    const posX = e.deltaX - this.panStartX;
    const openLeft =  posX > btnsLeftWidth / 2;
    const openRight =  posX < -btnsRightWidth / 2;

    if (openRight && posX < 0 && right.length) {
      this.open(-btnsRightWidth, false, true);
    } else if (openLeft && posX > 0 && left.length) {
      this.open(btnsLeftWidth, true, false);
    } else {
      this.close();
    }
  }

  // left & right button click
  onBtnClick(ev, btn) {
    const onPress = btn.onPress;
    if (onPress) {
      onPress(ev);
    }
    if (this.props.autoClose) {
      this.close();
    }
  }

  _getContentEasing(value, limit) {
    // limit content style left when value > actions width
    if (value < 0 && value < limit) {
      return limit - Math.pow(limit - value, 0.85);
    } else if (value > 0 && value > limit) {
      return limit + Math.pow(value - limit, 0.85);
    }
    return value;
  }

  // set content & actions style
  _setStyle(value) {
    const limit = value > 0 ? this.btnsLeftWidth : -this.btnsRightWidth;
    const contentLeft = this._getContentEasing(value, limit);
    this.content.style.left = `${contentLeft}px`;
    if (this.cover) {
      this.cover.style.display = Math.abs(value) > 0 ? 'block' : 'none';
      this.cover.style.left = `${contentLeft}px`;
    }
  }

  open(value, openedLeft, openedRight) {
    if (!this.openedLeft && !this.openedRight && this.props.onOpen) {
      this.props.onOpen();
    }

    this.openedLeft = openedLeft;
    this.openedRight = openedRight;
    this._setStyle(value);
  }

  close() {
    if ((this.openedLeft || this.openedRight) && this.props.onClose) {
      this.props.onClose();
    }
    this._setStyle(0);
    this.openedLeft = false;
    this.openedRight = false;
  }

  renderButtons(buttons, ref) {
    const prefixCls = this.props.prefixCls;

    return (buttons && buttons.length) ? (
      <div
        className={`${prefixCls}-actions ${prefixCls}-actions-${ref}`}
        ref={(el) => this[ref] = ReactDOM.findDOMNode(el)}
      >
        {
          buttons.map((btn, i) => (
            <div key={i}
              className={`${prefixCls}-btn ${btn.hasOwnProperty('className') ? btn.className : ''}`}
              style={btn.style}
              role="button"
              onClick={(e) => this.onBtnClick(e, btn)}
            >
              <div className={`${prefixCls}-btn-text`}>{btn.text || 'Click'}</div>
            </div>
          ))
        }
      </div>
    ) : null;
  }

  render() {
    const { prefixCls, left, right, disabled, children, ...restProps } = this.props;
    const divProps = omit(restProps, [
      'autoClose',
      'onOpen',
      'onClose',
    ]);

    const refProps = {
      ref: el => this.content = ReactDOM.findDOMNode(el),
    };

    return (left!.length || right!.length) && !disabled ? (
      <div className={`${prefixCls}`} {...divProps}>
        {/* 保证 body touchStart 后不触发 pan */}
        <div className={`${prefixCls}-cover`} ref={(el) => this.cover = ReactDOM.findDOMNode(el)} />
        { this.renderButtons(left, 'left') }
        { this.renderButtons(right, 'right') }
        <Hammer
          direction="DIRECTION_HORIZONTAL"
          onPanStart={this.onPanStart}
          onPan={this.onPan}
          onPanEnd={this.onPanEnd}
          {...refProps}
        >
          <div className={`${prefixCls}-content`}>{children}</div>
        </Hammer>
      </div>
    ) : (
      <div {...refProps} {...divProps}>{children}</div>
    );
  }
}

export default Swipeout;
