// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useState
} from 'react'
import { Link, NavLink } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { formatPreferredName } from 'lib-common/names'
import { desktopMin } from 'lib-components/breakpoints'
import { fontWeights } from 'lib-components/typography'
import useCloseOnOutsideClick from 'lib-components/utils/useCloseOnOutsideClick'
import { defaultMargins, Gap } from 'lib-components/white-space'
import colors from 'lib-customizations/common'
import {
  faBars,
  faChevronDown,
  faChevronUp,
  faCircleExclamation,
  faLockAlt,
  faSignIn,
  faSignOut,
  faTimes,
  faUser
} from 'lib-icons'

import { UnwrapResult } from '../async-rendering'
import { AuthContext, User } from '../auth/state'
import { langs, useLang, useTranslation } from '../localization'

import AttentionIndicator from './AttentionIndicator'
import { CircledChar } from './DesktopNav'
import { getLogoutUri, headerHeightMobile } from './const'

type Props = {
  showMenu: boolean
  setShowMenu: Dispatch<SetStateAction<boolean>>
  unreadMessagesCount: number
  unreadChildDocumentsCount: number
  unreadChildrenCount: number
  hideLoginButton: boolean
}

export default React.memo(function MobileNav({
  showMenu,
  setShowMenu,
  unreadMessagesCount,
  unreadChildDocumentsCount,
  unreadChildrenCount,
  hideLoginButton
}: Props) {
  const { user } = useContext(AuthContext)
  const t = useTranslation()
  const ref = useCloseOnOutsideClick<HTMLDivElement>(() => setShowMenu(false))
  const toggleMenu = useCallback(
    () => setShowMenu((show) => !show),
    [setShowMenu]
  )
  const close = useCallback(() => setShowMenu(false), [setShowMenu])

  return (
    <UnwrapResult result={user} loading={() => null}>
      {(user) => {
        const showAttentionIndicator =
          !showMenu &&
          (unreadMessagesCount > 0 ||
            unreadChildDocumentsCount > 0 ||
            unreadChildrenCount > 0 ||
            !!(user && !user.email))

        return (
          <Container ref={ref} data-qa="mobile-nav">
            <MenuButton
              onClick={toggleMenu}
              data-qa="menu-button"
              aria-label={showMenu ? t.header.closeMenu : t.header.openMenu}
            >
              <AttentionIndicator
                toggled={showAttentionIndicator}
                data-qa="attention-indicator-mobile"
              >
                <FontAwesomeIcon icon={showMenu ? faTimes : faBars} />
              </AttentionIndicator>
            </MenuButton>
            {showMenu && (
              <MenuContainer>
                <LanguageMenu close={close} />
                <Gap size="s" />
                {user && (
                  <Navigation
                    close={close}
                    user={user}
                    unreadMessagesCount={unreadMessagesCount}
                    unreadChildDocumentsCount={unreadChildDocumentsCount}
                    unreadChildrenCount={unreadChildrenCount}
                  />
                )}
                <VerticalSpacer />
                <UserContainer>
                  {user && <UserNameSubMenu user={user} close={close} />}
                  <Gap size="L" />
                  {user ? (
                    <Logout href={getLogoutUri(user)} data-qa="logout-btn">
                      <FontAwesomeIcon icon={faSignOut} size="lg" />
                      <Gap size="xs" horizontal />
                      {t.header.logout}
                    </Logout>
                  ) : hideLoginButton ? null : (
                    <Login to="/login" onClick={close} data-qa="login-btn">
                      <FontAwesomeIcon icon={faSignIn} size="lg" />
                      <Gap size="xs" horizontal />
                      {t.header.login}
                    </Login>
                  )}
                </UserContainer>
              </MenuContainer>
            )}
          </Container>
        )
      }}
    </UnwrapResult>
  )
})

const Container = styled.nav`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  @media (min-width: ${desktopMin}) {
    display: none;
  }
`

const MenuButton = styled.button`
  background: transparent;
  color: ${colors.grayscale.g0};
  border: none;
  padding: 16px 18px;
  height: 100%;
  cursor: pointer;

  svg {
    width: 20px !important;
    height: 20px !important;
  }
`

const MenuContainer = styled.div`
  position: fixed;
  overflow-y: scroll;
  top: ${headerHeightMobile}px;
  right: 0;
  background: ${colors.main.m2};
  box-sizing: border-box;
  width: 100vw;
  height: calc(100% - ${headerHeightMobile}px);
  padding: ${defaultMargins.s};
  z-index: 25;
  display: flex;
  flex-direction: column;
`

const LanguageMenu = React.memo(function LanguageMenu({
  close
}: {
  close: () => void
}) {
  const [lang, setLang] = useLang()
  const t = useTranslation()

  return (
    <LangList>
      {langs.map((l) => (
        <LangListElement key={l}>
          <LangButton
            active={l === lang}
            onClick={() => {
              setLang(l)
              close()
            }}
            aria-label={t.header.lang[l]}
            lang={l}
          >
            {l}
          </LangButton>
        </LangListElement>
      ))}
    </LangList>
  )
})

const LangList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`

const LangListElement = styled.li`
  margin: 0 ${defaultMargins.xxs};
`

const LangButton = styled.button<{ active: boolean }>`
  background: transparent;
  color: ${colors.grayscale.g0};
  padding: ${defaultMargins.xs};
  font-family: Montserrat, sans-serif;
  font-size: 1em;
  text-transform: uppercase;
  font-weight: ${(props) =>
    props.active ? fontWeights.bold : fontWeights.medium};
  cursor: pointer;
  border: none;
  border-bottom: 2px solid;
  border-color: ${(props) =>
    props.active ? colors.grayscale.g0 : 'transparent'};
`

const Navigation = React.memo(function Navigation({
  close,
  user,
  unreadMessagesCount,
  unreadChildDocumentsCount,
  unreadChildrenCount
}: {
  close: () => void
  user: User
  unreadMessagesCount: number
  unreadChildDocumentsCount: number
  unreadChildrenCount: number
}) {
  const t = useTranslation()

  const maybeLockElem = user.authLevel !== 'STRONG' && (
    <FontAwesomeIcon icon={faLockAlt} size="xs" />
  )
  return (
    <Nav role="menu">
      {user.accessibleFeatures.reservations && (
        <HeaderNavLink
          to="/calendar"
          onClick={close}
          data-qa="nav-calendar"
          text={t.header.nav.calendar}
        />
      )}
      {user.accessibleFeatures.messages && (
        <HeaderNavLink
          to="/messages"
          onClick={close}
          data-qa="nav-messages"
          text={t.header.nav.messages}
          notificationCount={unreadMessagesCount}
        />
      )}
      {user.accessibleFeatures.childDocumentation && (
        <HeaderNavLink
          to="/child-documents"
          data-qa="nav-child-documents"
          onClick={close}
          text={t.header.nav.pedagogicalDocuments}
          notificationCount={unreadChildDocumentsCount}
          lockElem={maybeLockElem}
        />
      )}
      <HeaderNavLink
        to="/children"
        onClick={close}
        data-qa="nav-children"
        text={t.header.nav.children}
        notificationCount={unreadChildrenCount}
        lockElem={maybeLockElem}
      />
      <HeaderNavLink
        to="/applying"
        onClick={close}
        data-qa="nav-applications"
        text={t.header.nav.applications}
      />
    </Nav>
  )
})

const NavLinkText = React.memo(function NavLinkText({
  text
}: {
  text: string
}) {
  return (
    <div>
      <SpaceReservingText aria-hidden="true">{text}</SpaceReservingText>
      <div>{text}</div>
    </div>
  )
})

const Nav = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${defaultMargins.s};

  color: inherit;
  font-family: Montserrat, sans-serif;
  font-weight: ${fontWeights.medium};
  text-decoration: none;
  text-transform: uppercase;
  padding: ${defaultMargins.xs} 0;
  margin: ${defaultMargins.xxs} 0;
  border-bottom: 2px solid transparent;

  &:hover {
    font-weight: ${fontWeights.bold};
    border-color: ${colors.grayscale.g0};
  }

  &:hover .circled-char,
  &.active .circled-char {
    border-width: 2px;
    padding: 10px;
  }

  &.active {
    font-weight: ${fontWeights.bold};
    border-color: ${colors.grayscale.g0};
  }
`

const SpaceReservingText = styled.span`
  display: block;
  height: 0;
  visibility: hidden;
  text-align: center;
  font-weight: ${fontWeights.bold};
  border-color: ${colors.grayscale.g0};
`

const VerticalSpacer = styled.div`
  margin: auto 0;
`

const UserContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const loginLogoutLinkStyles = css`
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${colors.main.m1};
  color: ${colors.grayscale.g0};
  border: none;
  font-family: 'Open Sans', sans-serif;
  font-size: 1em;
  font-weight: ${fontWeights.semibold};
  text-transform: uppercase;
  text-decoration: none;
  padding: ${defaultMargins.s};
  width: 100%;
`

const Login = styled(Link)`
  ${loginLogoutLinkStyles};
`

const Logout = styled.a`
  ${loginLogoutLinkStyles};
`

const UserNameSubMenu = React.memo(function UserNameSubMenu({
  user,
  close
}: {
  user: User
  close: () => void
}) {
  const t = useTranslation()
  const [show, setShow] = useState(false)
  const toggleShow = useCallback(
    () => setShow((previous) => !previous),
    [setShow]
  )
  const maybeLockElem = user.authLevel !== 'STRONG' && (
    <FontAwesomeIcon icon={faLockAlt} size="xs" />
  )

  return (
    <>
      <SubMenuButton onClick={toggleShow} data-qa="user-menu-title-mobile">
        <AttentionIndicator
          toggled={!user.email}
          data-qa="attention-indicator-mobile"
        >
          <FontAwesomeIcon icon={faUser} size="lg" />
        </AttentionIndicator>
        <Gap size="s" horizontal />
        <UserName>
          {formatPreferredName(user)} {user.lastName}
        </UserName>
        <Gap size="s" horizontal />
        <HorizontalSpacer />
        <FontAwesomeIcon icon={show ? faChevronUp : faChevronDown} size="lg" />
      </SubMenuButton>
      {show && (
        <Nav>
          <SubMenuLink
            to="/personal-details"
            onClick={close}
            data-qa="nav-personal-details"
          >
            {t.header.nav.personalDetails}
            {maybeLockElem}
            {!user.email && (
              <FontAwesomeIcon
                icon={faCircleExclamation}
                size="lg"
                data-qa="personal-details-attention-indicator-mobile"
              />
            )}
          </SubMenuLink>
          <SubMenuLink to="/income" onClick={close} data-qa="nav-income">
            {t.header.nav.income} {maybeLockElem}
          </SubMenuLink>
        </Nav>
      )}
    </>
  )
})

const SubMenuButton = styled(MenuButton)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0;
`

const HorizontalSpacer = styled.div`
  margin: 0 auto;
`

const SubMenuLink = styled(StyledNavLink)`
  margin-left: ${defaultMargins.L};
  text-transform: none;
  display: flex;
  gap: ${defaultMargins.xs};
`

const UserName = styled.span`
  font-weight: ${fontWeights.semibold};
`

const HeaderNavLink = React.memo(function HeaderNavLink({
  notificationCount,
  text,
  lockElem,
  ...props
}: {
  onClick: () => void
  to: string
  notificationCount?: number
  text: string
  lockElem?: React.ReactNode
  'data-qa'?: string
}) {
  const t = useTranslation()

  return (
    <StyledNavLink
      {...props}
      aria-label={`${text}${
        lockElem ? `, ${t.header.requiresStrongAuth}` : ''
      }${
        notificationCount && notificationCount > 0
          ? `, ${notificationCount} ${t.header.notifications}`
          : ''
      }`}
      role="menuitem"
    >
      <NavLinkText text={text} />
      {lockElem}
      {!!notificationCount && (
        <CircledChar
          aria-label={`${notificationCount} ${t.header.notifications}`}
          data-qa={props['data-qa'] && `${props['data-qa']}-notification-count`}
        >
          {notificationCount}
        </CircledChar>
      )}
    </StyledNavLink>
  )
})
