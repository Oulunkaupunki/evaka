// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.ktlint

import org.jetbrains.kotlin.com.intellij.lang.ASTNode
import org.jetbrains.kotlin.psi.KtCallExpression
import org.jetbrains.kotlin.psi.KtReferenceExpression

class NoPrint : EvakaRule("no-println") {
    private val printFunctions = setOf("print", "println")

    override fun afterVisitChildNodes(
        node: ASTNode,
        autoCorrect: Boolean,
        emit: (offset: Int, errorMessage: String, canBeAutoCorrected: Boolean) -> Unit
    ) {
        val expression = node.psi as? KtCallExpression ?: return
        val isPrintCall =
            expression.children.any { e ->
                e is KtReferenceExpression && printFunctions.contains(e.text)
            }
        if (isPrintCall) {
            emit(node.startOffset, ERROR_MESSAGE, false)
        }
    }

    companion object {
        const val ERROR_MESSAGE =
            "Do not use print or println for logging, use mu.KotlinLogging.logger instead"
    }
}
