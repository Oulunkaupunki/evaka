// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useRef, useState } from 'react'
import ReactCrop, { Crop } from 'react-image-crop'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Button from 'lib-components/atoms/buttons/Button'
import { FixedSpaceRow } from 'lib-components/layout/flex-helpers'
import { InformationText } from 'lib-components/typography'
import { defaultMargins, Gap } from 'lib-components/white-space'

import { uploadChildImage } from '../../../api/childImages'
import { useTranslation } from '../../../state/i18n'
import 'react-image-crop/dist/ReactCrop.css'

const defaultCrop: Partial<Crop> = {
  unit: '%',
  width: 80,
  x: 10,
  y: 10,
  aspect: 1
}

interface Props {
  childId: string
  image: string
  onReturn: () => void
}

export default React.memo(function ImageEditor({
  childId,
  image,
  onReturn
}: Props) {
  const { i18n } = useTranslation()
  const [crop, setCrop] = useState<Partial<Crop>>(defaultCrop)
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const [imageElem, setImageElem] = useState<HTMLImageElement | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const htmlNode = document.querySelector('html')
    if (htmlNode) {
      htmlNode.style.overscrollBehavior = 'none'
    }

    const popStateHandler = (e: PopStateEvent) => {
      e.preventDefault()
      navigate(1)
      onReturn()
    }

    window.addEventListener('popstate', popStateHandler)

    return () => {
      if (htmlNode) {
        htmlNode.style.overscrollBehavior = 'auto'
      }
      window.removeEventListener('popstate', popStateHandler)
    }
  }, [onReturn, navigate])

  const onSave = () => {
    if (!crop || !previewCanvasRef.current) {
      return
    }

    previewCanvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-image.jpeg', {
            type: blob.type
          })
          setSubmitting(true)
          void uploadChildImage(childId, file).then((res) => {
            setSubmitting(false)
            if (res.isFailure) {
              console.error('Uploading image failed', res.message)
            } else {
              onReturn()
            }
          })
        }
      },
      'image/jpeg',
      0.7
    )
  }

  useEffect(() => {
    if (!completedCrop || !previewCanvasRef.current || !imageElem) {
      return
    }

    const canvas = previewCanvasRef.current
    const crop = completedCrop

    const scaleX = imageElem.naturalWidth / imageElem.width
    const scaleY = imageElem.naturalHeight / imageElem.height
    const ctx = canvas.getContext('2d')
    const pixelRatio = window.devicePixelRatio

    canvas.width = (crop.width ?? 0) * pixelRatio
    canvas.height = (crop.height ?? 0) * pixelRatio

    if (ctx) {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.imageSmoothingQuality = 'high'

      ctx.drawImage(
        imageElem,
        (crop.x ?? 0) * scaleX,
        (crop.y ?? 0) * scaleY,
        (crop.width ?? 0) * scaleX,
        (crop.height ?? 0) * scaleY,
        0,
        0,
        crop.width ?? 0,
        crop.height ?? 0
      )
    }
  }, [imageElem, completedCrop])

  return (
    <Container>
      <CropWrapper>
        <ReactCrop
          src={image}
          crop={crop}
          onImageLoaded={setImageElem}
          onChange={(c) => setCrop(c)}
          onComplete={setCompletedCrop}
          circularCrop
        />
        <canvas
          ref={previewCanvasRef}
          style={{
            width: 256,
            height: 256,
            display: 'none'
          }}
        />
      </CropWrapper>

      <Gap />

      <InformationText centered>
        {i18n.childInfo.image.modalMenu.disclaimer}
      </InformationText>

      <ButtonRow>
        <Button
          text={i18n.common.cancel}
          onClick={onReturn}
          disabled={submitting}
        />
        <Button
          text={i18n.common.save}
          primary
          disabled={!completedCrop || submitting}
          onClick={onSave}
        />
      </ButtonRow>
    </Container>
  )
})

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  margin: ${defaultMargins.m};
`

const ButtonRow = styled(FixedSpaceRow)`
  width: 100%;
  justify-content: space-around;
  padding: ${defaultMargins.s};
`

const CropWrapper = styled.div`
  flex-grow: 1;
  flex-shrink: 1;

  .ReactCrop .ord-nw {
    top: -24px;
    left: -24px;
  }

  .ReactCrop .ord-nw::after {
    top: 24px;
    left: 24px;
  }

  .ReactCrop .ord-ne {
    top: -24px;
    right: -24px;
  }

  .ReactCrop .ord-ne::after {
    top: 24px;
    right: 24px;
  }

  .ReactCrop .ord-se {
    bottom: -24px;
    right: -24px;
  }

  .ReactCrop .ord-se::after {
    bottom: 24px;
    right: 24px;
  }

  .ReactCrop .ord-sw {
    bottom: -24px;
    left: -24px;
  }

  .ReactCrop .ord-sw::after {
    bottom: 24px;
    left: 24px;
  }

  .ReactCrop__drag-handle {
    width: 64px;
    height: 64px;
  }
`
