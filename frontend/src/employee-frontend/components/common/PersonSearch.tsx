// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import { Result, Success, wrapResult } from 'lib-common/api'
import { PersonSummary } from 'lib-common/generated/api-types/pis'
import { PersonId } from 'lib-common/generated/api-types/shared'
import { tryFromUuid } from 'lib-common/id-type'
import { getAge } from 'lib-common/utils/local-date'
import { useDebounce } from 'lib-common/utils/useDebounce'
import { useRestApi } from 'lib-common/utils/useRestApi'
import Combobox from 'lib-components/atoms/dropdowns/Combobox'
import { BaseProps } from 'lib-components/utils'

import {
  getOrCreatePersonBySsn,
  getPersonIdentity,
  searchPerson
} from '../../generated/api-clients/pis'
import { useTranslation } from '../../state/i18n'
import { formatName } from '../../utils'
import { isSsnValid } from '../../utils/validation/validations'

const getPersonIdentityResult = wrapResult(getPersonIdentity)
const searchPersonResult = wrapResult(searchPerson)
const getOrCreatePersonBySsnResult = wrapResult(getOrCreatePersonBySsn)

const Container = styled.div`
  margin: 10px 0;
`

const searchFromVtj = async (q: string): Promise<Result<PersonSummary[]>> => {
  if (isSsnValid(q.toUpperCase())) {
    return await getOrCreatePersonBySsnResult({
      body: { ssn: q.toUpperCase(), readonly: true }
    }).then((res) => res.map((r) => [r]))
  }

  return Success.of([])
}

const search = async (q: string): Promise<Result<PersonSummary[]>> => {
  if (isSsnValid(q.toUpperCase())) {
    return await getOrCreatePersonBySsnResult({
      body: { ssn: q.toUpperCase(), readonly: false }
    }).then((res) => res.map((r) => [r]))
  }

  const personId = tryFromUuid<PersonId>(q)
  if (personId !== undefined) {
    return await getPersonIdentityResult({ personId }).then((res) =>
      res.map((r) => [r])
    )
  }

  return await searchPersonResult({
    body: {
      searchTerm: q,
      orderBy: 'last_name,first_name',
      sortDirection: 'ASC'
    }
  })
}

interface Props extends BaseProps {
  getItemDataQa: (item: PersonSummary) => string
  filterItems: (
    inputValue: string,
    items: readonly PersonSummary[]
  ) => PersonSummary[]
  searchFn: (q: string) => Promise<Result<PersonSummary[]>>
  onResult: (result: PersonSummary | undefined) => void
  onFocus?: (e: React.FocusEvent<HTMLElement>) => void
  ageLessThan?: number
  ageAtLeast?: number
  excludePeople?: PersonId[]
}

function PersonSearch({
  filterItems,
  searchFn,
  onResult,
  onFocus,
  ageLessThan,
  ageAtLeast,
  excludePeople,
  'data-qa': dataQa,
  getItemDataQa
}: Props) {
  const { i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [persons, setPersons] = useState<Result<PersonSummary[]>>(
    Success.of([])
  )
  const [selectedPerson, setSelectedPerson] = useState<PersonSummary>()
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    onResult(selectedPerson)
  }, [selectedPerson]) // eslint-disable-line react-hooks/exhaustive-deps

  const searchPeople = useRestApi(searchFn, setPersons)
  useEffect(() => {
    void searchPeople(debouncedQuery)
  }, [searchPeople, debouncedQuery])

  const filterPeople = (people: PersonSummary[]) =>
    people.filter((person) => {
      if (excludePeople && excludePeople.includes(person.id)) return false
      if (!person.dateOfBirth) return true
      const age = getAge(person.dateOfBirth)
      if (ageLessThan !== undefined && age >= ageLessThan) return false
      if (ageAtLeast !== undefined && age < ageAtLeast) return false
      return true
    })

  const options = useMemo(
    () => persons.map((ps) => filterPeople(ps)).getOrElse([]),
    [persons] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const formatItemLabel = useCallback(
    ({ firstName, lastName }: PersonSummary) =>
      formatName(firstName, lastName, i18n),
    [i18n]
  )

  const formatMenuItemLabel = useCallback(
    ({
      dateOfBirth,
      firstName,
      lastName,
      streetAddress
    }: PersonSummary): string =>
      `${formatName(firstName, lastName, i18n)} (${dateOfBirth.format()})${
        streetAddress ? `\n${streetAddress}` : ''
      }`,
    [i18n]
  )

  const onChange = useCallback(
    (option: PersonSummary | null) => setSelectedPerson(option || undefined),
    []
  )
  return (
    <Container data-qa={dataQa}>
      <Combobox
        placeholder={i18n.common.search}
        clearable
        selectedItem={selectedPerson ?? null}
        items={options}
        getItemLabel={formatItemLabel}
        getMenuItemLabel={formatMenuItemLabel}
        getItemDataQa={getItemDataQa}
        onInputChange={setQuery}
        onChange={onChange}
        isLoading={persons.isLoading || query !== debouncedQuery}
        menuEmptyLabel={i18n.common.noResults}
        filterItems={filterItems}
        onFocus={onFocus}
      />
    </Container>
  )
}

type PersonSearchProps = Omit<
  Props,
  'filterItems' | 'getItemDataQa' | 'searchFn'
>

export function DbPersonSearch(props: PersonSearchProps) {
  const filterItems = useCallback(
    (_: string, items: readonly PersonSummary[]) => [...items],
    []
  )
  const getItemDataQa = useCallback((p: PersonSummary) => `person-${p.id}`, [])

  return (
    <PersonSearch
      {...props}
      filterItems={filterItems}
      getItemDataQa={getItemDataQa}
      searchFn={search}
    />
  )
}

export function VtjPersonSearch(props: PersonSearchProps) {
  const filterItems = useCallback(
    (_: string, items: readonly PersonSummary[]) =>
      items.filter((i) => i.socialSecurityNumber),
    []
  )
  const getItemDataQa = useCallback(
    (p: PersonSummary) => `person-${p.socialSecurityNumber ?? 'null'}`,
    []
  )
  return (
    <PersonSearch
      {...props}
      filterItems={filterItems}
      getItemDataQa={getItemDataQa}
      searchFn={searchFromVtj}
    />
  )
}
