// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.data

import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.domain.HelsinkiDateTimeRange
import java.time.LocalDateTime
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue
import org.junit.jupiter.api.RepeatedTest
import org.junit.jupiter.api.Test

class DateTimeSetTest {
    @Test
    fun `an empty datetime set has no ranges, gaps, or spanning range`() {
        val set = DateTimeSet.empty()
        assertEquals(emptyList(), set.ranges().toList())
        assertEquals(emptyList(), set.gaps().toList())
        assertNull(set.spanningRange())
        assertTrue(set.isEmpty())
    }

    @Test
    fun `a datetime set with a single range has no gaps and its range is the spanning range`() {
        val range = testRange(1, 2)
        val set = DateTimeSet.of(range)
        assertEquals(listOf(range), set.ranges().toList())
        assertEquals(emptyList(), set.gaps().toList())
        assertEquals(range, set.spanningRange())
        assertFalse(set.isEmpty())
    }

    @Test
    fun `a datetime set with three ranges has two gaps`() {
        // 123456789
        // AA_BB_CC_
        //   G_ G_
        val set = DateTimeSet.of(testRange(1, 3), testRange(4, 6), testRange(7, 9))
        val gaps = listOf(testRange(3, 4), testRange(6, 7))
        assertEquals(gaps, set.gaps().toList())
    }

    @RepeatedTest(100)
    fun `multiple non-adjacent non-overlapping ranges can be added to a datetime set, in any order`() {
        // 1234567
        // AA_
        //    BBB_
        val ranges = listOf(testRange(1, 3), testRange(4, 7)).shuffled()
        val set = DateTimeSet.of(ranges)
        assertTrue(ranges.all { set.contains(it) })
        assertEquals(ranges.sortedBy { it.start }, set.ranges().toList())
    }

    @RepeatedTest(100)
    fun `overlapping ranges are merged when added to a datetime set, in any order`() {
        // 1234567
        // AAAA_
        //   BBBB_
        // XXXXXX_
        val ranges = listOf(testRange(1, 5), testRange(3, 7)).shuffled()
        val x = testRange(1, 7)
        val set = DateTimeSet.of(ranges)
        assertTrue(ranges.all { set.contains(it) })
        assertEquals(listOf(x), set.ranges().toList())
    }

    @RepeatedTest(100)
    fun `adjacent ranges are merged when added to a datetime set, in any order`() {
        // 1234567
        // AA_
        //   BB_
        //     CC_
        // XXXXXX_
        val ranges = listOf(testRange(1, 3), testRange(3, 5), testRange(5, 7)).shuffled()
        val x = testRange(1, 7)
        val set = DateTimeSet.of(ranges)
        assertTrue(ranges.all { set.contains(it) })
        assertEquals(listOf(x), set.ranges().toList())
    }

    @RepeatedTest(100)
    fun `ranges can be removed from a datetime set, in any order`() {
        val ranges = listOf(testRange(1, 2), testRange(5, 6)).shuffled()
        val set = DateTimeSet.of(ranges).removeAll(ranges)
        assertFalse(ranges.all { set.contains(it) })
        assertEquals(emptyList(), set.ranges().toList())
    }

    @RepeatedTest(100)
    fun `parts of ranges can be removed from a datetime set, in any order`() {
        // 123456789
        // ++_++_++_
        //  ---_--_
        // A_  B_ C_
        val added = listOf(testRange(1, 3), testRange(4, 6), testRange(7, 9)).shuffled()
        val removed = listOf(testRange(2, 5), testRange(6, 8)).shuffled()
        val set = DateTimeSet.of(added).removeAll(removed)
        assertEquals(
            listOf(testRange(1, 2), testRange(5, 6), testRange(8, 9)),
            set.ranges().toList(),
        )
    }

    @Test
    fun `an empty datetime set includes and contains nothing`() {
        val set = DateTimeSet.empty()
        assertFalse(set.contains(testRange(1, 2)))
        assertFalse(set.includes(testDateTime(1)))
    }

    @Test
    fun `a datetime set with a single range contains and fully includes its range`() {
        val range = testRange(1, 2)
        val set = DateTimeSet.of(range)
        assertTrue(set.contains(range))
    }

    @Test
    fun `intersection between datetime sets works correctly`() {
        // 123456789
        // AA_AA_AA_
        //  BBB_  B_
        //  X_X_  X_
        val a = DateTimeSet.of(testRange(1, 3), testRange(4, 6), testRange(7, 9))
        val b = DateTimeSet.of(testRange(2, 5), testRange(8, 9))
        val x = DateTimeSet.of(testRange(2, 3), testRange(4, 5), testRange(8, 9))
        assertEquals(x, a.intersection(b))
        assertEquals(x, b.intersection(a))
    }

    @Test
    fun `intersectRanges takes a clamp range that both filters and clamps the returned results`() {
        // 123456789
        // AA_ A_ A_
        //  RRRRRR_
        //  =_ =_
        val a = DateTimeSet.of(testRange(1, 3), testRange(5, 6), testRange(8, 9))
        val r = testRange(2, 8)
        assertEquals(listOf(testRange(2, 3), testRange(5, 6)), a.intersectRanges(r).toList())
    }

    private fun testDateTime(hour: Int) = HelsinkiDateTime.of(LocalDateTime.of(2019, 1, 1, hour, 0))

    private fun testRange(from: Int, to: Int) =
        HelsinkiDateTimeRange(testDateTime(from), testDateTime(to))
}
