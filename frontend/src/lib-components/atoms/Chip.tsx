// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'
import { readableColor } from 'polished'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { faCheck } from 'lib-icons'
import { useSingleAndDoubleClick } from 'lib-common/utils/useSingleAndDoubleClick'

import colors from '../colors'
import { defaultMargins } from '../white-space'
import { tabletMin } from '../breakpoints'

export const StaticChip = styled.div<{ color: string; textColor?: string }>`
  font-family: 'Open Sans', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  user-select: none;
  border: 1px solid ${(p) => p.color};
  border-radius: 1000px;
  background-color: ${(p) => p.color};
  color: ${(p) =>
    p.textColor ??
    readableColor(p.color, colors.greyscale.darkest, colors.greyscale.white)};
  padding: ${defaultMargins.xxs}
    calc(${defaultMargins.xs} + ${defaultMargins.xxs});

  outline: none;
  &:focus {
    outline: 2px solid ${colors.blues.light};
    outline-offset: 2px;
  }
`

type SelectionChipProps = {
  text: string
  selected: boolean
  onChange: (selected: boolean) => void
  'data-qa'?: string
  showIcon?: boolean
}

export const SelectionChip = React.memo(function SelectionChip({
  text,
  selected,
  onChange,
  'data-qa': dataQa,
  showIcon = true
}: SelectionChipProps) {
  const ariaId = Math.random().toString(36).substring(2, 15)
  const { handleClick, handleDoubleClick } = useSingleAndDoubleClick(
    onClick,
    onDoubleClick
  )

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    onChange(!selected)
  }

  function onDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  return (
    <div data-qa={dataQa}>
      <SelectionChipWrapper
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <SelectionChipInnerWrapper
          className={classNames({ checked: selected })}
        >
          <HiddenInput
            type="checkbox"
            onChange={() => onChange(!selected)}
            checked={selected}
            id={ariaId}
          />
          {showIcon && selected && (
            <IconWrapper>
              <FontAwesomeIcon icon={faCheck} />
            </IconWrapper>
          )}
          <StyledLabel
            className={classNames({ checked: showIcon && selected })}
            htmlFor={ariaId}
          >
            {text}
          </StyledLabel>
        </SelectionChipInnerWrapper>
      </SelectionChipWrapper>
    </div>
  )
})

export const ChoiceChip = React.memo(function ChoiceChip({
  text,
  selected,
  onChange,
  'data-qa': dataQa
}: SelectionChipProps) {
  return (
    <SelectionChip
      text={text}
      selected={selected}
      onChange={onChange}
      data-qa={dataQa}
      showIcon={false}
    />
  )
})

const StyledLabel = styled.label`
  cursor: pointer;
  &.checked {
    margin-left: 32px;
  }
`

const SelectionChipWrapper = styled.div`
  font-family: 'Open Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  user-select: none;
  border-radius: 1000px;
  cursor: pointer;
  outline: none;

  &:focus,
  &:focus-within {
    border: 2px solid ${colors.accents.petrol};
    border-radius: 1000px;
    margin: -2px;
  }
  padding: 2px;
`

const SelectionChipInnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 1000px;
  padding: 0 calc(${defaultMargins.xs} + ${defaultMargins.xxs});
  background-color: ${colors.greyscale.white};
  color: ${colors.primary};
  border: 1px solid ${colors.primary};
  &.checked {
    background-color: ${colors.primary};
    color: ${colors.greyscale.white};
  }

  @media (max-width: ${tabletMin}) {
    height: 40px;
  }
`

const HiddenInput = styled.input`
  outline: none;
  appearance: none;
  border: none;
  background: none;
  margin: 0;
  height: 32px;
  width: 0;
`

const IconWrapper = styled.div`
  position: absolute;
  left: calc(${defaultMargins.xs} + ${defaultMargins.xxs});
  top: 0;

  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 32px;

  font-size: 24px;
  color: ${colors.greyscale.white};
`
