// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { faInfo, faRedo } from 'lib-icons'
import Toast from './Toast'
import { useTheme } from 'styled-components'
import InlineButton from '../atoms/buttons/InlineButton'
import { appVersion } from 'lib-common/globals'

// If the user closes the toast, remind every 5 minutes
const REMIND_INTERVAL = 5 * 60 * 1000

interface ReloadNotificationTranslations {
  title: string
  buttonText: string
}

interface Props {
  apiVersion: string | undefined
  i18n: ReloadNotificationTranslations
}

export default function ReloadNotification({ apiVersion, i18n }: Props) {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const timer = useRef<number>()

  const maybeShow = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = undefined
    }
    if (apiVersion !== undefined && apiVersion !== appVersion) {
      setShow(true)
    }
  }, [apiVersion])

  useEffect(maybeShow, [maybeShow])

  const close = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = setTimeout(maybeShow, REMIND_INTERVAL)
    setShow(false)
  }, [maybeShow])

  return show ? (
    <Toast icon={faInfo} iconColor={theme.colors.main.dark} onClose={close}>
      <div>{i18n.title}</div>
      <div>
        <InlineButton
          icon={faRedo}
          text={i18n.buttonText}
          onClick={() => {
            window.location.reload()
          }}
        />
      </div>
    </Toast>
  ) : null
}
