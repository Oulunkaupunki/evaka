// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useButton } from '@react-aria/button'
import { AriaButtonProps } from '@react-types/button'
import classNames from 'classnames'
import omit from 'lodash/omit'
import React from 'react'
import styled from 'styled-components'

import { BaseProps } from '../../utils'
import { IconSize } from '../icon-size'

export interface ButtonProps {
  size?: IconSize | undefined
  gray?: boolean
  white?: boolean
  color?: string
}

const StyledButton = styled.button<ButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: calc(
    12px +
      ${(props: ButtonProps) => {
        switch (props.size) {
          case 's':
            return '20px'
          case 'm':
            return '24px'
          case 'L':
            return '34px'
          case 'XL':
            return '64px'
          default:
            return '20px'
        }
      }}
  );
  height: calc(
    12px +
      ${(props: ButtonProps) => {
        switch (props.size) {
          case 's':
            return '20px'
          case 'm':
            return '24px'
          case 'L':
            return '34px'
          case 'XL':
            return '64px'
          default:
            return '20px'
        }
      }}
  );
  font-size: ${(props: ButtonProps) => {
    switch (props.size) {
      case 's':
        return '20px'
      case 'm':
        return '24px'
      case 'L':
        return '34px'
      case 'XL':
        return '64px'
      default:
        return '20px'
    }
  }};
  color: ${(p) =>
    p.color
      ? p.color
      : p.gray
      ? p.theme.colors.grayscale.g70
      : p.white
      ? p.theme.colors.grayscale.g0
      : p.theme.colors.main.m2};
  border: none;
  border-radius: 100%;
  background: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  margin: -6px;
  -webkit-tap-highlight-color: transparent;

  &:focus {
    box-shadow: 0 0 0 2px ${(p) => p.theme.colors.main.m2Focus};
  }

  .icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2px;
  }

  &:hover .icon-wrapper {
    color: ${(p) =>
      p.color
        ? p.color
        : p.gray
        ? p.theme.colors.grayscale.g70
        : p.white
        ? p.theme.colors.grayscale.g0
        : p.theme.colors.main.m2Hover};
  }

  &:active .icon-wrapper {
    color: ${(p) =>
      p.color
        ? p.color
        : p.gray
        ? p.theme.colors.grayscale.g100
        : p.theme.colors.main.m2Active};
  }

  &.disabled,
  &:disabled {
    cursor: not-allowed;

    .icon-wrapper {
      color: ${(p) => p.theme.colors.grayscale.g35};
    }
  }
`

export type IconButtonProps = AriaButtonProps<'button'> & {
  children?: React.ReactNode
} & ButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  BaseProps & {
    icon: IconDefinition
  } & (
    | {
        'aria-label': string
      }
    | {
        'aria-hidden': string | true
      }
  )

export default React.memo(function IconButton({
  disabled,
  icon,
  color,
  ...props
}: IconButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const { buttonProps } = useButton(props, ref)

  return (
    <StyledButton
      type="button"
      disabled={disabled}
      {...omit(props, ['onPress'])}
      {...buttonProps}
      className={classNames(props.className, { disabled })}
      ref={ref}
      color={color}
    >
      <div className="icon-wrapper">
        <FontAwesomeIcon icon={icon} />
      </div>
    </StyledButton>
  )
})
