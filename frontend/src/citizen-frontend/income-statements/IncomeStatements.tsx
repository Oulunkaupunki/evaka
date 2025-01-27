// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { Fragment, useCallback, useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import styled from 'styled-components'

import { renderResult } from 'citizen-frontend/async-rendering'
import { IncomeStatement } from 'lib-common/generated/api-types/incomestatement'
import { IncomeStatementId } from 'lib-common/generated/api-types/shared'
import { useMutation, useQueryResult } from 'lib-common/query'
import Pagination from 'lib-components/Pagination'
import HorizontalLine from 'lib-components/atoms/HorizontalLine'
import Main from 'lib-components/atoms/Main'
import { Button } from 'lib-components/atoms/buttons/Button'
import ResponsiveAddButton from 'lib-components/atoms/buttons/ResponsiveAddButton'
import Container, { ContentArea } from 'lib-components/layout/Container'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import {
  MobileOnly,
  TabletAndDesktop
} from 'lib-components/layout/responsive-layout'
import InfoModal from 'lib-components/molecules/modals/InfoModal'
import { Dimmed, H1, H2, H3 } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { faPen, faQuestion, faTrash, faFile } from 'lib-icons'

import Footer from '../Footer'
import { useTranslation } from '../localization'
import { OverlayContext } from '../overlay/state'

import ChildrenIncomeStatements from './ChildrenIncomeStatements'
import {
  deleteIncomeStatementMutation,
  guardianIncomeStatementChildrenQuery,
  incomeStatementsQuery
} from './queries'

const HeadingContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

function getLink(id: IncomeStatementId, mode: 'view' | 'edit') {
  return `/income/${id}/${mode === 'edit' ? 'edit' : ''}`
}

interface TableOrListProps {
  items: IncomeStatement[]
  onEdit: (id: IncomeStatementId) => void
  onRemoveIncomeStatement: (id: IncomeStatementId) => void
}

const IncomeStatementsTable = React.memo(function IncomeStatementsTable({
  items,
  onEdit,
  onRemoveIncomeStatement
}: TableOrListProps) {
  const t = useTranslation()

  return (
    <Table data-qa="income-statements-table">
      <Thead>
        <Tr>
          <Th>{t.income.table.incomeStatementForm}</Th>
          <Th>{t.income.table.createdAt}</Th>
          <Th>{t.income.table.sentAt}</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {items.map((item) => (
          <Tr key={item.id} data-qa="income-statement-row">
            <Td>
              <Link
                to={getLink(item.id, 'view')}
                data-qa={`button-open-income-statement-${item.id}`}
              >
                {item.startDate.format()} - {item.endDate?.format()}
              </Link>
            </Td>
            <Td>{item.createdAt.toLocalDate().format()}</Td>
            <Td>
              {item.sentAt
                ? item.sentAt.toLocalDate().format()
                : t.income.table.notSent}
            </Td>
            <Td>
              <FixedSpaceRow justifyContent="flex-end">
                {item.status === 'HANDLED' ? (
                  <Dimmed>{t.income.table.handled}</Dimmed>
                ) : (
                  <>
                    <Button
                      appearance="inline"
                      icon={faPen}
                      text={
                        item.status === 'DRAFT'
                          ? t.common.edit
                          : t.income.table.actions.addDetails
                      }
                      onClick={() => onEdit(item.id)}
                      data-qa="edit-income-statement"
                    />
                    <Button
                      appearance="inline"
                      icon={faTrash}
                      text={
                        item.status === 'DRAFT'
                          ? t.common.delete
                          : t.income.table.actions.cancel
                      }
                      onClick={() => onRemoveIncomeStatement(item.id)}
                    />
                  </>
                )}
              </FixedSpaceRow>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
})

const IncomeStatementsList = React.memo(function IncomeStatementsList({
  items,
  onEdit,
  onRemoveIncomeStatement
}: TableOrListProps) {
  const t = useTranslation()
  const navigate = useNavigate()

  const onView = useCallback(
    (id: IncomeStatementId) => navigate(getLink(id, 'view')),
    [navigate]
  )

  return (
    <div data-qa="income-statements-list">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && <HorizontalLine />}
          <FixedSpaceColumn
            spacing="s"
            alignItems="flex-start"
            data-qa="income-statement-row"
          >
            <H3>
              {item.startDate.format()} - {item.endDate?.format()}
            </H3>
            <div>
              {t.income.table.status}: {t.income.table.statuses[item.status]}
            </div>
            <div>
              {t.income.table.createdAt}:{' '}
              {item.createdAt.toLocalDate().format()}
            </div>
            <div>
              {t.income.table.sentAt}:{' '}
              {item.sentAt?.toLocalDate()?.format() ?? '-'}
            </div>
            <Button
              appearance="inline"
              icon={faFile}
              text={t.income.table.actions.view}
              onClick={() => onView(item.id)}
            />
            {item.status !== 'HANDLED' && (
              <>
                <Button
                  appearance="inline"
                  icon={faPen}
                  text={
                    item.status === 'DRAFT'
                      ? t.common.edit
                      : t.income.table.actions.addDetails
                  }
                  onClick={() => onEdit(item.id)}
                  data-qa="edit-income-statement"
                />
                <Button
                  appearance="inline"
                  icon={faTrash}
                  text={
                    item.status === 'DRAFT'
                      ? t.common.delete
                      : t.income.table.actions.cancel
                  }
                  onClick={() => onRemoveIncomeStatement(item.id)}
                />
              </>
            )}
          </FixedSpaceColumn>
        </Fragment>
      ))}
    </div>
  )
})

type DeletionState =
  | {
      status: 'row-not-selected'
    }
  | {
      status: 'confirming' | 'deleting'
      rowToDelete: IncomeStatementId
    }

export default React.memo(function IncomeStatements() {
  const t = useTranslation()
  const navigate = useNavigate()
  const { setErrorMessage } = useContext(OverlayContext)

  const [page, setPage] = useState(1)
  const incomeStatements = useQueryResult(incomeStatementsQuery({ page }))
  const { mutateAsync: deleteIncomeStatement } = useMutation(
    deleteIncomeStatementMutation
  )

  const children = useQueryResult(guardianIncomeStatementChildrenQuery(), {
    staleTime: 1000 * 60 * 60 * 24 // children change rarely
  })

  const [deletionState, setDeletionState] = useState<DeletionState>({
    status: 'row-not-selected'
  })

  const onEdit = useCallback(
    (id: IncomeStatementId) => navigate(getLink(id, 'edit')),
    [navigate]
  )

  const onDelete = useCallback(
    (id: IncomeStatementId) => {
      setDeletionState({ status: 'deleting', rowToDelete: id })
      deleteIncomeStatement({ id })
        .then(() => {
          setDeletionState({ status: 'row-not-selected' })
        })
        .catch(() => {
          setErrorMessage({
            title: t.income.errors.deleteFailed,
            type: 'error',
            resolveLabel: t.common.ok
          })
        })
    },
    [deleteIncomeStatement, setErrorMessage, t]
  )

  return (
    <>
      <Main>
        <Container>
          <Gap size="s" />
          <ContentArea opaque paddingVertical="L">
            <H1 noMargin>{t.income.title}</H1>
            {t.income.description}
          </ContentArea>
          <Gap size="s" />
          <ContentArea opaque paddingVertical="L">
            <HeadingContainer>
              <H2>{t.income.table.title}</H2>
              <ResponsiveAddButton
                onClick={() => void navigate('/income/new/edit')}
                text={t.income.addNew}
                data-qa="new-income-statement-btn"
              />
            </HeadingContainer>
            {renderResult(incomeStatements, ({ data, pages }) => (
              <>
                <TabletAndDesktop>
                  <IncomeStatementsTable
                    items={data}
                    onEdit={onEdit}
                    onRemoveIncomeStatement={(id) =>
                      setDeletionState({
                        status: 'confirming',
                        rowToDelete: id
                      })
                    }
                  />
                </TabletAndDesktop>
                <MobileOnly>
                  <IncomeStatementsList
                    items={data}
                    onEdit={onEdit}
                    onRemoveIncomeStatement={(id) =>
                      setDeletionState({
                        status: 'confirming',
                        rowToDelete: id
                      })
                    }
                  />
                </MobileOnly>
                <Gap />
                <Pagination
                  pages={pages}
                  currentPage={page}
                  setPage={setPage}
                  label={t.common.page}
                  hideIfOnlyOnePage={true}
                />
              </>
            ))}

            {deletionState.status !== 'row-not-selected' && (
              <InfoModal
                type="warning"
                title={t.income.table.deleteConfirm}
                text={t.income.table.deleteDescription}
                icon={faQuestion}
                reject={{
                  action: () =>
                    setDeletionState({ status: 'row-not-selected' }),
                  label: t.common.return
                }}
                resolve={{
                  action: () => onDelete(deletionState.rowToDelete),
                  label: t.common.delete,
                  disabled: deletionState.status === 'deleting'
                }}
              />
            )}
          </ContentArea>
          <Gap size="s" />
          {renderResult(children, (children) => (
            <>
              <ChildrenIncomeStatements childInfo={children} />
            </>
          ))}
        </Container>
      </Main>
      <Footer />
    </>
  )
})
