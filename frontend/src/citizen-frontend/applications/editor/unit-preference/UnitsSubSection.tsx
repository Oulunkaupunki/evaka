// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import { Result, Success } from 'lib-common/api'
import { ApplicationType } from 'lib-common/generated/api-types/application'
import { PublicUnit } from 'lib-common/generated/api-types/daycare'
import LocalDate from 'lib-common/local-date'
import { useApiState } from 'lib-common/utils/useRestApi'
import { SelectionChip } from 'lib-components/atoms/Chip'
import ExternalLink from 'lib-components/atoms/ExternalLink'
import MultiSelect from 'lib-components/atoms/form/MultiSelect'
import {
  FixedSpaceColumn,
  FixedSpaceFlexWrap,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { AlertBox } from 'lib-components/molecules/MessageBoxes'
import { H3, Label, P } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import colors from 'lib-customizations/common'

import PreferredUnitBox from '../../../applications/editor/unit-preference/PreferredUnitBox'
import { UnwrapResult } from '../../../async-rendering'
import { useTranslation } from '../../../localization'
import { ApplicationUnitType, getApplicationUnits } from '../../api'

import { UnitPreferenceSectionProps } from './UnitPreferenceSection'

const maxUnits = 3

async function fetchUnits(
  preferredStartDate: LocalDate | null,
  applicationType: ApplicationType,
  preparatory: boolean,
  shiftCare: boolean
): Promise<Result<PublicUnit[]>> {
  if (!preferredStartDate) {
    return Success.of([])
  } else {
    const unitType: ApplicationUnitType =
      applicationType === 'CLUB'
        ? 'CLUB'
        : applicationType === 'DAYCARE'
        ? 'DAYCARE'
        : preparatory
        ? 'PREPARATORY'
        : 'PRESCHOOL'

    return await getApplicationUnits(unitType, preferredStartDate, shiftCare)
  }
}

export default React.memo(function UnitsSubSection({
  formData,
  updateFormData,
  errors,
  verificationRequested,
  applicationType,
  preparatory,
  preferredStartDate,
  shiftCare
}: UnitPreferenceSectionProps) {
  const t = useTranslation()
  const [displayFinnish, setDisplayFinnish] = useState(true)
  const [displaySwedish, setDisplaySwedish] = useState(false)

  const [units] = useApiState(
    () =>
      fetchUnits(preferredStartDate, applicationType, preparatory, shiftCare),
    [preferredStartDate, applicationType, preparatory, shiftCare]
  )

  useEffect(() => {
    if (units.isSuccess) {
      updateFormData({
        preferredUnits: formData.preferredUnits.filter(({ id }) =>
          units.value.some((unit) => unit.id === id)
        )
      })
    }
  }, [units]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <H3>{t.applications.editor.unitPreference.units.title}</H3>
      {t.applications.editor.unitPreference.units.info[applicationType]}

      <ExternalLink
        href="/map"
        text={t.applications.editor.unitPreference.units.mapLink}
        newTab
      />

      <Gap size="s" />

      {!preferredStartDate ? (
        <div>
          <AlertBox
            message={
              t.applications.editor.unitPreference.units.startDateMissing
            }
          />
        </div>
      ) : (
        <>
          <Label>
            {t.applications.editor.unitPreference.units.languageFilter.label}
          </Label>
          <Gap size="xs" />
          <FixedSpaceRow>
            <SelectionChip
              text={
                t.applications.editor.unitPreference.units.languageFilter.fi
              }
              selected={displayFinnish}
              onChange={setDisplayFinnish}
            />
            <SelectionChip
              text={
                t.applications.editor.unitPreference.units.languageFilter.sv
              }
              selected={displaySwedish}
              onChange={setDisplaySwedish}
            />
          </FixedSpaceRow>

          <Gap size="m" />

          <UnwrapResult result={units}>
            {(units, _isReloading) => (
              <FixedSpaceFlexWrap horizontalSpacing="L" verticalSpacing="s">
                <FixedWidthDiv>
                  <Label htmlFor="unit-selector">
                    {t.applications.editor.unitPreference.units.select.label} *
                  </Label>
                  <Gap size="xs" />
                  <MultiSelect
                    data-qa="preferredUnits-input"
                    inputId="unit-selector"
                    value={units.filter(
                      (u) =>
                        !!formData.preferredUnits.find((u2) => u2.id === u.id)
                    )}
                    options={units.filter(
                      (u) =>
                        (displayFinnish && u.language === 'fi') ||
                        (displaySwedish && u.language === 'sv')
                    )}
                    getOptionId={(unit) => unit.id}
                    getOptionLabel={(unit) => unit.name}
                    getOptionSecondaryText={(unit) => unit.streetAddress}
                    onChange={(selected) => {
                      if (selected.length <= maxUnits) {
                        updateFormData({
                          preferredUnits: selected
                        })
                      }
                    }}
                    maxSelected={maxUnits}
                    isClearable={false}
                    placeholder={
                      formData.preferredUnits.length < maxUnits
                        ? t.applications.editor.unitPreference.units.select
                            .placeholder
                        : t.applications.editor.unitPreference.units.select
                            .maxSelected
                    }
                    noOptionsMessage={
                      t.applications.editor.unitPreference.units.select
                        .noOptions
                    }
                    showValuesInInput={false}
                  />

                  <Gap size="s" />
                  <Info>
                    {
                      t.applications.editor.unitPreference.units.preferences
                        .info
                    }
                  </Info>
                  <Gap size="xs" />
                </FixedWidthDiv>
                <FixedWidthDiv>
                  <Label>
                    {
                      t.applications.editor.unitPreference.units.preferences
                        .label
                    }
                  </Label>
                  <Gap size="xs" />
                  {!verificationRequested &&
                    formData.preferredUnits.length === 0 && (
                      <Info>
                        {
                          t.applications.editor.unitPreference.units.preferences
                            .noSelections
                        }
                      </Info>
                    )}
                  {verificationRequested &&
                    errors.preferredUnits?.arrayErrors && (
                      <AlertBox
                        message={
                          t.validationErrors[errors.preferredUnits.arrayErrors]
                        }
                        thin
                      />
                    )}
                  <FixedSpaceColumn spacing="s">
                    {formData.preferredUnits
                      .map((u) => units.find((u2) => u.id === u2.id))
                      .map((unit, i) =>
                        unit ? (
                          <PreferredUnitBox
                            key={unit.id}
                            unit={unit}
                            n={i + 1}
                            remove={() =>
                              updateFormData({
                                preferredUnits: [
                                  ...formData.preferredUnits.slice(0, i),
                                  ...formData.preferredUnits.slice(i + 1)
                                ]
                              })
                            }
                            moveUp={
                              i > 0
                                ? () =>
                                    updateFormData({
                                      preferredUnits: [
                                        ...formData.preferredUnits.slice(
                                          0,
                                          i - 1
                                        ),
                                        formData.preferredUnits[i],
                                        formData.preferredUnits[i - 1],
                                        ...formData.preferredUnits.slice(i + 1)
                                      ]
                                    })
                                : null
                            }
                            moveDown={
                              i < formData.preferredUnits.length - 1
                                ? () =>
                                    updateFormData({
                                      preferredUnits: [
                                        ...formData.preferredUnits.slice(0, i),
                                        formData.preferredUnits[i + 1],
                                        formData.preferredUnits[i],
                                        ...formData.preferredUnits.slice(i + 2)
                                      ]
                                    })
                                : null
                            }
                          />
                        ) : null
                      )}
                  </FixedSpaceColumn>
                </FixedWidthDiv>
              </FixedSpaceFlexWrap>
            )}
          </UnwrapResult>
        </>
      )}
    </>
  )
})

const FixedWidthDiv = styled.div`
  width: 100%;
  max-width: 480px;
`

const Info = styled(P)`
  color: ${colors.grayscale.g70};
  margin: 0;
`