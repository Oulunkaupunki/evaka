// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { useApiState } from 'lib-common/utils/useRestApi'
import RoundIcon from 'lib-components/atoms/RoundIcon'
import Title from 'lib-components/atoms/Title'
import { Container, ContentArea } from 'lib-components/layout/Container'
import { fontWeights } from 'lib-components/typography'
import { defaultMargins } from 'lib-components/white-space'
import colors from 'lib-customizations/common'
import { featureFlags } from 'lib-customizations/employee'
import {
  faCar,
  faChild,
  faClock,
  faCopy,
  faDatabase,
  faDiagnoses,
  faEuroSign,
  faFileAlt,
  faGavel,
  faHandHolding,
  faHome,
  faHourglassEnd,
  faHourglassStart,
  faMoneyBillWave,
  faPercentage,
  faUserAltSlash,
  faUsers
} from 'lib-icons'

import { getPermittedReports } from '../api/reports'
import { useTranslation } from '../state/i18n'

import { renderResult } from './async-rendering'
import { AssistanceNeedDecisionReportContext } from './reports/AssistanceNeedDecisionReportContext'

const ReportItems = styled.div`
  margin: 20px 0;
`

const ReportItem = styled.div`
  margin-bottom: 25px;
`

const TitleRow = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  > * {
    margin-right: ${defaultMargins.s};
  }
`

const LinkTitle = styled(Link)`
  text-transform: uppercase;
  margin: 0;
  font-size: 0.9rem;
  font-weight: ${fontWeights.semibold};
`
const Description = styled.p`
  margin-left: calc(34px + ${defaultMargins.s});
  width: 70%;
`

const UnreadCount = styled.span`
  color: ${colors.main.m2};
  font-size: 0.9rem;
  font-weight: ${fontWeights.semibold};
  margin-left: ${defaultMargins.xs};
  border: 1.5px solid ${colors.main.m2};
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-radius: 100%;
  width: ${defaultMargins.m};
  height: ${defaultMargins.m};
`

const Report = React.memo(function Report(props: {
  path: string
  color: string
  icon: IconDefinition
  i18n: {
    title: string
    description: string
  }
  'data-qa'?: string
  children?: React.ReactNode
}) {
  return (
    <ReportItem>
      <TitleRow>
        <RoundIcon size="L" color={props.color} content={props.icon} />
        <LinkTitle to={props.path} data-qa={props['data-qa']}>
          {props.i18n.title}
        </LinkTitle>
        {props.children}
      </TitleRow>
      <Description>{props.i18n.description}</Description>
    </ReportItem>
  )
})

export default React.memo(function Reports() {
  const { i18n } = useTranslation()
  const { assistanceNeedDecisionCounts } = useContext(
    AssistanceNeedDecisionReportContext
  )

  const [permittedReports] = useApiState(getPermittedReports, [])

  return (
    <Container>
      <ContentArea opaque>
        <Title size={1}>{i18n.reports.title}</Title>
        {renderResult(permittedReports, (reports) => {
          return (
            <ReportItems>
              {reports.has('DUPLICATE_PEOPLE') && (
                <Report
                  path="/reports/duplicate-people"
                  color={colors.status.warning}
                  icon={faCopy}
                  i18n={i18n.reports.duplicatePeople}
                />
              )}
              {reports.has('FAMILY_CONFLICT') && (
                <Report
                  path="/reports/family-conflicts"
                  color={colors.status.warning}
                  icon={faUsers}
                  i18n={i18n.reports.familyConflicts}
                />
              )}
              {reports.has('MISSING_HEAD_OF_FAMILY') && (
                <Report
                  path="/reports/missing-head-of-family"
                  color={colors.status.warning}
                  icon={faUserAltSlash}
                  i18n={i18n.reports.missingHeadOfFamily}
                />
              )}
              {reports.has('MISSING_SERVICE_NEED') && (
                <Report
                  path="/reports/missing-service-need"
                  color={colors.status.warning}
                  icon={faClock}
                  i18n={i18n.reports.missingServiceNeed}
                />
              )}
              {reports.has('PARTNERS_IN_DIFFERENT_ADDRESS') && (
                <Report
                  path="/reports/partners-in-different-address"
                  color={colors.status.warning}
                  icon={faHome}
                  i18n={i18n.reports.partnersInDifferentAddress}
                />
              )}
              {reports.has('CHILDREN_IN_DIFFERENT_ADDRESS') && (
                <Report
                  path="/reports/children-in-different-address"
                  color={colors.accents.a5orangeLight}
                  icon={faHome}
                  i18n={i18n.reports.childrenInDifferentAddress}
                />
              )}
              {reports.has('APPLICATIONS') && (
                <Report
                  path="/reports/applications"
                  color={colors.main.m2}
                  icon={faFileAlt}
                  i18n={i18n.reports.applications}
                  data-qa="report-applications"
                />
              )}
              {reports.has('DECISIONS') && (
                <Report
                  path="/reports/decisions"
                  color={colors.main.m2}
                  icon={faGavel}
                  i18n={i18n.reports.decisions}
                  data-qa="report-decisions"
                />
              )}
              {reports.has('OCCUPANCY') && (
                <Report
                  path="/reports/occupancies"
                  color={colors.main.m2}
                  icon={faPercentage}
                  i18n={i18n.reports.occupancies}
                />
              )}
              {reports.has('CHILD_AGE_LANGUAGE') && (
                <Report
                  path="/reports/child-age-language"
                  color={colors.main.m2}
                  icon={faChild}
                  i18n={i18n.reports.childAgeLanguage}
                />
              )}
              {reports.has('SERVICE_NEED') && (
                <Report
                  path="/reports/service-needs"
                  color={colors.main.m2}
                  icon={faChild}
                  i18n={i18n.reports.serviceNeeds}
                />
              )}
              {reports.has('ASSISTANCE_NEEDS_AND_ACTIONS') && (
                <Report
                  path="/reports/assistance-needs-and-actions"
                  color={colors.main.m2}
                  icon={faHandHolding}
                  i18n={i18n.reports.assistanceNeedsAndActions}
                />
              )}
              {reports.has('INVOICE') && (
                <Report
                  path="/reports/invoices"
                  color={colors.main.m2}
                  icon={faEuroSign}
                  i18n={i18n.reports.invoices}
                />
              )}
              {reports.has('STARTING_PLACEMENTS') && (
                <Report
                  path="/reports/starting-placements"
                  color={colors.main.m2}
                  icon={faHourglassStart}
                  i18n={i18n.reports.startingPlacements}
                />
              )}
              {reports.has('ENDED_PLACEMENTS') && (
                <Report
                  path="/reports/ended-placements"
                  color={colors.main.m2}
                  icon={faHourglassEnd}
                  i18n={i18n.reports.endedPlacements}
                />
              )}
              {reports.has('PRESENCE') && (
                <Report
                  path="/reports/presences"
                  color={colors.main.m2}
                  icon={faDiagnoses}
                  i18n={i18n.reports.presence}
                />
              )}
              {reports.has('SERVICE_VOUCHER_VALUE') && (
                <Report
                  path="/reports/voucher-service-providers"
                  color={colors.main.m2}
                  icon={faMoneyBillWave}
                  i18n={i18n.reports.voucherServiceProviders}
                  data-qa="report-voucher-service-providers"
                />
              )}
              {reports.has('ATTENDANCE_RESERVATION') && (
                <Report
                  path="/reports/attendance-reservation"
                  color={colors.main.m2}
                  icon={faCar}
                  i18n={i18n.reports.attendanceReservation}
                  data-qa="report-attendance-reservation"
                />
              )}
              {reports.has('ATTENDANCE_RESERVATION') && (
                <Report
                  path="/reports/attendance-reservation-by-child"
                  color={colors.main.m2}
                  icon={faCar}
                  i18n={i18n.reports.attendanceReservationByChild}
                  data-qa="report-attendance-reservation-by-child"
                />
              )}
              {reports.has('SEXTET') && (
                <Report
                  path="/reports/sextet"
                  color={colors.main.m2}
                  icon={faDiagnoses}
                  i18n={i18n.reports.sextet}
                  data-qa="report-sextet"
                />
              )}
              {reports.has('RAW') && (
                <Report
                  path="/reports/raw"
                  color={colors.main.m2}
                  icon={faDatabase}
                  i18n={i18n.reports.raw}
                />
              )}
              {featureFlags.experimental?.assistanceNeedDecisions &&
                reports.has('ASSISTANCE_NEED_DECISIONS') && (
                  <Report
                    path="/reports/assistance-need-decisions"
                    color={colors.main.m2}
                    icon={faHandHolding}
                    i18n={i18n.reports.assistanceNeedDecisions}
                  >
                    {assistanceNeedDecisionCounts
                      .map(
                        (unread) =>
                          unread > 0 && <UnreadCount>{unread}</UnreadCount>
                      )
                      .getOrElse(null)}
                  </Report>
                )}
              {reports.has('PLACEMENT_COUNT') && (
                <Report
                  path="/reports/placement-count"
                  color={colors.main.m2}
                  icon={faChild}
                  i18n={i18n.reports.placementCount}
                  data-qa="report-placement-count"
                />
              )}
              {reports.has('PLACEMENT_SKETCHING') && (
                <Report
                  path="/reports/placement-sketching"
                  color={colors.status.warning}
                  icon={faUsers}
                  i18n={i18n.reports.placementSketching}
                  data-qa="report-placement-sketching"
                />
              )}
              {reports.has('VARDA_ERRORS') && (
                <Report
                  data-qa="report-varda-errors"
                  path="/reports/varda-errors"
                  color={colors.status.warning}
                  icon={faDiagnoses}
                  i18n={i18n.reports.vardaErrors}
                />
              )}
            </ReportItems>
          )
        })}
      </ContentArea>
    </Container>
  )
})
