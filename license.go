// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.
//
// VAULTX — One tool. Zero blind spots.
//
// This software is the confidential and proprietary information of
// threatvec & talkdedsec. You shall not disclose such confidential
// information and shall use it only in accordance with the terms
// of the license agreement you entered into with the authors.
//
// Unauthorized copying, distribution, modification, public display,
// or public performance of this software or any portion of it is
// strictly prohibited.

package main

// LicenseText is the full proprietary license text embedded in the binary.
const LicenseText = `Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.

VAULTX — One tool. Zero blind spots.

This software is proprietary and confidential. Unauthorized copying,
distribution, modification, public display, or public performance of this
software or any portion of it is strictly prohibited.

This software is provided "AS IS" without warranty of any kind, express or
implied. In no event shall the authors be liable for any claim, damages, or
other liability arising from the use of this software.

For licensing inquiries: https://github.com/threatvec/vaultx`

// GetLicense returns the license text.
func (a *App) GetLicense() string {
	return LicenseText
}
