// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState } from 'react'
import styled from 'styled-components'

import { Result } from 'lib-common/api'
import { Language, PublicUnit } from 'lib-common/generated/api-types/daycare'
import { SelectionChip } from 'lib-components/atoms/Chip'
import InlineButton from 'lib-components/atoms/buttons/InlineButton'
import Checkbox from 'lib-components/atoms/form/Checkbox'
import Radio from 'lib-components/atoms/form/Radio'
import { ContentArea } from 'lib-components/layout/Container'
import {
  FixedSpaceColumn,
  FixedSpaceFlexWrap,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { fontWeights, H1, Label, P } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { featureFlags, unitProviderTypes } from 'lib-customizations/citizen'
import colors from 'lib-customizations/common'
import { faAngleDown, faAngleUp } from 'lib-icons'
import { faArrowLeft } from 'lib-icons'

import { useTranslation } from '../localization'
import SearchInput from '../map/SearchInput'

import { CareTypeOption, MapAddress, ProviderTypeOption } from './MapView'

interface Props {
  allUnits: Result<PublicUnit[]>
  careType: CareTypeOption
  setCareType: (c: CareTypeOption) => void
  languages: Language[]
  setLanguages: (val: Language[]) => void
  providerTypes: ProviderTypeOption[]
  setProviderTypes: (val: ProviderTypeOption[]) => void
  shiftCare: boolean
  setShiftCare: (val: boolean) => void
  selectedAddress: MapAddress | null
  setSelectedAddress: (address: MapAddress | null) => void
  setSelectedUnit: (u: PublicUnit | null) => void
  navigateBack?: () => void
}

export default React.memo(function SearchSection({
  allUnits,
  careType,
  setCareType,
  languages,
  setLanguages,
  providerTypes,
  setProviderTypes,
  shiftCare,
  setShiftCare,
  selectedAddress,
  setSelectedAddress,
  setSelectedUnit,
  navigateBack
}: Props) {
  const t = useTranslation()

  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false)

  function groupedList<T>(flatList: T[], subListSize: number): T[][] {
    return flatList.reduce(
      (groups: T[][], element: T, i: number) => {
        i % subListSize != 0 || i == 0
          ? groups[groups.length - 1].push(element)
          : groups.push([element])
        return groups
      },
      [[]] as T[][]
    )
  }

  return (
    <Wrapper opaque>
      {navigateBack && (
        <InlineButton
          text={t.common.return}
          icon={faArrowLeft}
          onClick={navigateBack}
        />
      )}
      <Gap size="s" />
      <H1 noMargin>{t.map.title}</H1>
      <P data-qa="map-main-info">
        {t.map.mainInfo}
        <PrivateUnitInfo>{t.map.privateUnitInfo}</PrivateUnitInfo>
      </P>

      <FixedSpaceColumn spacing="xs">
        <Label>{t.map.searchLabel}</Label>
        <SearchInput
          allUnits={allUnits}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
          setSelectedUnit={setSelectedUnit}
        />
      </FixedSpaceColumn>

      <Gap size="m" />

      <FixedSpaceColumn spacing="xs">
        <Label>{t.map.careType}</Label>
        <FixedSpaceFlexWrap>
          <Radio
            data-qa="map-filter-daycare"
            checked={careType === 'DAYCARE'}
            label={t.map.careTypes.DAYCARE}
            onChange={() => setCareType('DAYCARE')}
          />
          {featureFlags.preschoolEnabled && (
            <Radio
              data-qa="map-filter-preschool"
              checked={careType === 'PRESCHOOL'}
              label={t.map.careTypes.PRESCHOOL}
              onChange={() => setCareType('PRESCHOOL')}
            />
          )}
          <Radio
            data-qa="map-filter-club"
            checked={careType === 'CLUB'}
            label={t.map.careTypes.CLUB}
            onChange={() => setCareType('CLUB')}
          />
        </FixedSpaceFlexWrap>
      </FixedSpaceColumn>

      <Gap size="xs" />

      <FixedSpaceColumn spacing="xs">
        <Label>{t.map.language}</Label>
        <FixedSpaceRow>
          <SelectionChip
            data-qa="map-filter-fi"
            text={t.common.unit.languagesShort.fi}
            selected={languages.includes('fi')}
            onChange={(selected) => {
              const nextValue = languages.filter((l) => l !== 'fi')
              if (selected) nextValue.push('fi')
              setLanguages(nextValue)
            }}
          />
          <SelectionChip
            data-qa="map-filter-sv"
            text={t.common.unit.languagesShort.sv}
            selected={languages.includes('sv')}
            onChange={(selected) => {
              const nextValue = languages.filter((l) => l !== 'sv')
              if (selected) nextValue.push('sv')
              setLanguages(nextValue)
            }}
          />
        </FixedSpaceRow>
      </FixedSpaceColumn>

      {showMoreFilters && (
        <>
          <FixedSpaceColumn spacing="xs">
            <Gap size="m" />
            <Label>{t.map.providerType}</Label>

            {groupedList(unitProviderTypes as ProviderTypeOption[], 2).map(
              (types, idx) => {
                return (
                  <FixedSpaceRow spacing="s" key={`${types[idx]} + ${idx}`}>
                    {types.map((type) => (
                      <SelectionChip
                        data-qa={`map-filter-provider-${type.toLowerCase()}`}
                        key={type}
                        text={t.map.providerTypes[type]}
                        selected={providerTypes.includes(type)}
                        onChange={(selected) => {
                          const nextValue = providerTypes.filter(
                            (t) => t !== type
                          )
                          if (selected) nextValue.push(type)
                          setProviderTypes(nextValue)
                        }}
                      />
                    ))}
                  </FixedSpaceRow>
                )
              }
            )}
          </FixedSpaceColumn>

          <Gap size="m" />

          <FixedSpaceColumn spacing="xs">
            <Label>{t.map.shiftCareTitle}</Label>
            <Checkbox
              label={t.map.shiftCareLabel}
              checked={shiftCare}
              onChange={(checked) => setShiftCare(checked)}
            />
          </FixedSpaceColumn>
        </>
      )}

      <Gap size="m" />

      <InlineButton
        data-qa="map-filter-show-more"
        onClick={() => setShowMoreFilters(!showMoreFilters)}
        text={showMoreFilters ? t.map.showLessFilters : t.map.showMoreFilters}
        icon={showMoreFilters ? faAngleUp : faAngleDown}
        iconRight
      />
    </Wrapper>
  )
})

const Wrapper = styled(ContentArea)`
  box-sizing: border-box;
  width: 100%;
`

const PrivateUnitInfo = styled.span`
  font-weight: ${fontWeights.semibold};
  font-size: 14px;
  line-height: 21px;
  color: ${colors.grayscale.g70};
  display: block;
`
