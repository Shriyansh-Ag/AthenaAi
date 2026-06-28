import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import Page from '../src/app/page'

test('renders the page', () => {
  render(<Page />)
  // Just testing that it renders without crashing
  expect(document.body).toBeInTheDocument()
})
